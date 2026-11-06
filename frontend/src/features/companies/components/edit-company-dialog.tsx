
'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

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
} from '@mui/material';

import {
  getCompanies,
  getCompanyByCode,
  updateCompany,
} from '@/lib/api/companies';

import type {
  Company,
  UpdateCompanyRequest,
} from '@/lib/api/companies';

import { ApiError } from '@/lib/api/client';

interface EditCompanyDialogProps {
  open: boolean;
  company: Company;
  onClose: () => void;
  onUpdated: (company: Company) => void;
}

interface FormValues {
  companyName: string;
  level: number;
  country: string;
  city: string;
  foundedYear: string;
  annualRevenue: string;
  employees: string;
}

function getInitialForm(company: Company): FormValues {
  return {
    companyName: company.companyName,
    level: company.level,
    country: company.country,
    city: company.city,
    foundedYear: String(company.foundedYear),
    annualRevenue: String(company.annualRevenue),
    employees: String(company.employees),
  };
}

function getParentLabel(company: Company): string {
  return `${company.companyName} (${company.companyCode})`;
}

export default function EditCompanyDialog({
  open,
  company,
  onClose,
  onUpdated,
}: EditCompanyDialogProps) {
  const [form, setForm] = useState<FormValues>(
    () => getInitialForm(company),
  );

  const [parentCompany, setParentCompany] =
    useState<Company | null>(null);

  const selectedParentRef = useRef<Company | null>(null);
  const selectedParentRequestRef = useRef(0);

  const [parentSearch, setParentSearch] = useState('');
  const [parentInputValue, setParentInputValue] = useState('');
  const [parentOptions, setParentOptions] = useState<Company[]>([]);

  const [parentsLoading, setParentsLoading] = useState(false);

  const [selectedParentLoading, setSelectedParentLoading] =
    useState(Boolean(company.parentCompanyCode));

  const [parentError, setParentError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const isRootCompany = company.level === 1;

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Load the existing parent company.
  useEffect(() => {
    if (
      !open ||
      isRootCompany ||
      !company.parentCompanyCode
    ) {
      return;
    }

    let cancelled = false;
    const requestId = ++selectedParentRequestRef.current;

    void getCompanyByCode(company.parentCompanyCode)
      .then((parent) => {
        if (
          cancelled ||
          requestId !== selectedParentRequestRef.current
        ) {
          return;
        }

        selectedParentRef.current = parent;
        setParentCompany(parent);
        setParentInputValue(getParentLabel(parent));

        setParentOptions((previous) =>
          previous.some(
            (item) => item.companyCode === parent.companyCode,
          )
            ? previous
            : [parent, ...previous],
        );
      })
      .catch((error: unknown) => {
        if (
          cancelled ||
          requestId !== selectedParentRequestRef.current
        ) {
          return;
        }

        setParentError(
          error instanceof Error
            ? error.message
            : 'Unable to load current parent company.',
        );
      })
      .finally(() => {
        if (
          !cancelled &&
          requestId === selectedParentRequestRef.current
        ) {
          setSelectedParentLoading(false);
        }
      });

    return () => {
      cancelled = true;
      selectedParentRequestRef.current += 1;
    };
  }, [
    open,
    isRootCompany,
    company.parentCompanyCode,
  ]);

  // Load valid parent companies according to the selected level.
  useEffect(() => {
    if (!open || isRootCompany) return;

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

        const selectedParent = selectedParentRef.current;

        setParentOptions(
          selectedParent &&
            !result.items.some(
              (item) =>
                item.companyCode === selectedParent.companyCode,
            )
            ? [selectedParent, ...result.items]
            : result.items,
        );
      } catch (error: unknown) {
        if (cancelled) return;

        setParentOptions([]);

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
  }, [
    open,
    isRootCompany,
    form.level,
    parentSearch,
  ]);

  const handleLevelChange = (nextLevel: number) => {
    if (nextLevel === form.level) return;

    updateField('level', nextLevel);

    // A changed level requires a new valid parent.
    selectedParentRequestRef.current += 1;
    selectedParentRef.current = null;

    setParentCompany(null);
    setParentSearch('');
    setParentInputValue('');
    setParentError('');
    setSubmitError('');
    setSelectedParentLoading(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitError('');

    const companyName = form.companyName.trim();
    const country = form.country.trim();
    const city = form.city.trim();

    if (!companyName || !country || !city) {
      setSubmitError(
        'Company name, country and city are required.',
      );
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
      setSubmitError('Invalid founded year.');
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

    const payload: UpdateCompanyRequest = {};

    // Only include changed fields.
    if (companyName !== company.companyName) {
      payload.companyName = companyName;
    }

    if (country !== company.country) {
      payload.country = country;
    }

    if (city !== company.city) {
      payload.city = city;
    }

    if (foundedYear !== company.foundedYear) {
      payload.foundedYear = foundedYear;
    }

    if (annualRevenue !== company.annualRevenue) {
      payload.annualRevenue = annualRevenue;
    }

    if (employees !== company.employees) {
      payload.employees = employees;
    }

    if (!isRootCompany) {
      if (selectedParentLoading) {
        setSubmitError('Please wait for the parent company to load.');
        return;
      }

      if (!parentCompany) {
        setSubmitError('Please select a parent company.');
        return;
      }

      if (parentCompany.level !== form.level - 1) {
        setSubmitError(
          `A Level ${form.level} company must have a Level ${form.level - 1} parent.`,
        );
        return;
      }

      if (form.level !== company.level) {
        payload.level = form.level;
      }

      if (
        parentCompany.companyCode !== company.parentCompanyCode
      ) {
        payload.parentCompanyCode = parentCompany.companyCode;
      }
    }

    if (Object.keys(payload).length === 0) {
      setSubmitError('No changes to save.');
      return;
    }

    setSubmitting(true);

    try {
      const updated = await updateCompany(
        company.companyCode,
        payload,
      );

      onUpdated(updated);
      onClose();
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to update company.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Company
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
              value={company.companyCode}
              disabled
              fullWidth
              size="small"
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
              slotProps={{
                htmlInput: {
                  maxLength: 100,
                },
              }}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="edit-company-level">
                Level
              </InputLabel>

              <Select<number>
                labelId="edit-company-level"
                value={form.level}
                label="Level"
                disabled={isRootCompany}
                onChange={(event) =>
                  handleLevelChange(Number(event.target.value))
                }
              >
                {[1, 2, 3, 4].map((level) => (
                  <MenuItem
                    key={level}
                    value={level}
                    disabled={level === 1}
                  >
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              fullWidth
              size="small"
              disabled={isRootCompany}
              options={parentOptions}
              value={parentCompany}
              inputValue={parentInputValue}
              loading={parentsLoading || selectedParentLoading}
              getOptionLabel={getParentLabel}
              isOptionEqualToValue={(option, value) =>
                option.companyCode === value.companyCode
              }
              onInputChange={(_, value, reason) => {
                setParentInputValue(value);

                if (reason === 'input') {
                  setParentSearch(value);
                } else if (reason === 'clear') {
                  setParentSearch('');
                }
              }}
              onChange={(_, value) => {
                selectedParentRef.current = value;
                setParentCompany(value);
                setParentInputValue(
                  value ? getParentLabel(value) : '',
                );
                setParentSearch('');
                setSubmitError('');
              }}
              noOptionsText="No parent companies found."
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Company"
                  required={!isRootCompany}
                  error={Boolean(parentError)}
                  helperText={
                    isRootCompany
                      ? 'Root company hierarchy cannot be modified.'
                      : parentError ||
                        `Only Level ${form.level - 1} companies are allowed.`
                  }
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {(parentsLoading || selectedParentLoading) && (
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
              slotProps={{
                htmlInput: {
                  maxLength: 100,
                },
              }}
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
              slotProps={{
                htmlInput: {
                  maxLength: 100,
                },
              }}
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

          {parentError && !isRootCompany && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {parentError}
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
            onClick={onClose}
            disabled={submitting}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || selectedParentLoading}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
