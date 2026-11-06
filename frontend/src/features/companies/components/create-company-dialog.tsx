
'use client';

import { useEffect, useState, type FormEvent } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import {
  createCompany,
  getCompanies,
} from '@/lib/api/companies';

import type {
  Company,
  CreateCompanyRequest,
} from '@/lib/api/companies';

import { ApiError } from '@/lib/api/client';

interface CreateCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (company: Company) => void;
}

interface FormValues {
  companyCode: string;
  companyName: string;
  level: number;
  country: string;
  city: string;
  foundedYear: string;
  annualRevenue: string;
  employees: string;
}

const INITIAL_FORM: FormValues = {
  companyCode: '',
  companyName: '',
  level: 2,
  country: '',
  city: '',
  foundedYear: '',
  annualRevenue: '',
  employees: '',
};

export default function CreateCompanyDialog({
  open,
  onClose,
  onCreated,
}: CreateCompanyDialogProps) {
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);

  const [parentCompany, setParentCompany] =
    useState<Company | null>(null);

  const [parentSearch, setParentSearch] = useState('');
  const [parentOptions, setParentOptions] = useState<Company[]>([]);
  const [parentTotal, setParentTotal] = useState(0);

  const [parentsLoading, setParentsLoading] = useState(false);
  const [parentError, setParentError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setParentCompany(null);
    setParentSearch('');
    setParentOptions([]);
    setParentTotal(0);
    setParentError('');
    setSubmitError('');
  };

  const handleClose = () => {
    if (submitting) return;

    resetForm();
    onClose();
  };

  // Load parent companies according to selected level.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setParentsLoading(true);
      setParentError('');

      try {
        const result = await getCompanies({
          levels: [form.level - 1],
          search: parentSearch.trim() || undefined,
          page: 1,
          pageSize: 100,
        });

        if (cancelled) return;

        setParentOptions(result.items);
        setParentTotal(result.total);
      } catch (error: unknown) {
        if (cancelled) return;

        setParentOptions([]);
        setParentTotal(0);

        setParentError(
          error instanceof Error
            ? error.message
            : 'Unable to load parent companies.',
        );
      } finally {
        if (!cancelled) {
          setParentsLoading(false);
        }
      }
    }, parentSearch.trim() ? 350 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, form.level, parentSearch]);

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitError('');

    const companyCode = form.companyCode.trim().toUpperCase();

    if (!/^[A-Z0-9_-]{1,32}$/.test(companyCode)) {
      setSubmitError('Invalid company code format.');
      return;
    }

    if (!parentCompany) {
      setSubmitError('Please select a parent company.');
      return;
    }

    const foundedYear = Number(form.foundedYear);
    const annualRevenue = Number(form.annualRevenue);
    const employees = Number(form.employees);

    if (
      !Number.isInteger(foundedYear) ||
      foundedYear < 1 ||
      foundedYear > 9999
    ) {
      setSubmitError('Please enter a valid founded year.');
      return;
    }

    if (
      !Number.isSafeInteger(annualRevenue) ||
      annualRevenue < 0 ||
      annualRevenue > 2147483647
    ) {
      setSubmitError('Invalid annual revenue.');
      return;
    }

    if (
      !Number.isSafeInteger(employees) ||
      employees < 0 ||
      employees > 2147483647
    ) {
      setSubmitError('Invalid employee count.');
      return;
    }

    const payload: CreateCompanyRequest = {
      companyCode,
      companyName: form.companyName.trim(),
      level: form.level,
      country: form.country.trim(),
      city: form.city.trim(),
      foundedYear,
      annualRevenue,
      employees,
      parentCompanyCode: parentCompany.companyCode,
    };

    if (
      !payload.companyName ||
      !payload.country ||
      !payload.city
    ) {
      setSubmitError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await createCompany(payload);

      onCreated(created);
      resetForm();
      onClose();
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to create company.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Company
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              label="Company Code"
              value={form.companyCode}
              onChange={(event) =>
                updateField(
                  'companyCode',
                  event.target.value.toUpperCase(),
                )
              }
              required
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: 32 } }}
            />

            <TextField
              label="Company Name"
              value={form.companyName}
              onChange={(event) =>
                updateField('companyName', event.target.value)
              }
              required
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="create-company-level">
                Level
              </InputLabel>

              <Select<number>
                labelId="create-company-level"
                value={form.level}
                label="Level"
                onChange={(event) => {
                  const nextLevel = Number(event.target.value);

                  updateField('level', nextLevel);
                  setParentCompany(null);
                  setParentSearch('');
                  setSubmitError('');
                }}
              >
                {[2, 3, 4].map((level) => (
                  <MenuItem key={level} value={level}>
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              fullWidth
              size="small"
              options={parentOptions}
              value={parentCompany}
              loading={parentsLoading}
              inputValue={parentSearch}
              getOptionLabel={(option) =>
                `${option.companyName} (${option.companyCode})`
              }
              isOptionEqualToValue={(option, value) =>
                option.companyCode === value.companyCode
              }
              onInputChange={(_, value, reason) => {
                if (reason === 'input' || reason === 'clear') {
                  setParentSearch(value);
                }
              }}
              onChange={(_, value) => {
                setParentCompany(value);
                setSubmitError('');
              }}
              noOptionsText="No parent companies found."
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Company"
                  required
                  error={Boolean(parentError)}
                  helperText={
                    parentError ||
                    `Only Level ${form.level - 1} companies are allowed.`
                  }
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {parentsLoading && (
                            <CircularProgress
                              size={18}
                              sx={{ mr: 1 }}
                            />
                          )}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />

            <TextField
              label="Country"
              value={form.country}
              onChange={(event) =>
                updateField('country', event.target.value)
              }
              required
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

            <TextField
              label="City"
              value={form.city}
              onChange={(event) =>
                updateField('city', event.target.value)
              }
              required
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

            <TextField
              label="Founded Year"
              type="number"
              value={form.foundedYear}
              onChange={(event) =>
                updateField('foundedYear', event.target.value)
              }
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Annual Revenue"
              type="number"
              value={form.annualRevenue}
              onChange={(event) =>
                updateField('annualRevenue', event.target.value)
              }
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Employees"
              type="number"
              value={form.employees}
              onChange={(event) =>
                updateField('employees', event.target.value)
              }
              required
              fullWidth
              size="small"
            />
          </Box>

          {parentTotal > parentOptions.length && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              Showing the first 100 results. Search by company name
              to find other parent companies.
            </Typography>
          )}

          {parentError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Unable to load parent companies. Please try again.
            </Alert>
          )}

          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || parentsLoading}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Create Company'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
