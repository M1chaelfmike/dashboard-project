
'use client';

import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

interface CompanyFiltersProps {
  search: string;
  levels: number[];

  onSearchChange: (value: string) => void;
  onLevelsChange: (value: number[]) => void;
}

const LEVEL_OPTIONS = [1, 2, 3, 4];

export default function CompanyFilters({
  search,
  levels,
  onSearchChange,
  onLevelsChange,
}: CompanyFiltersProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ width: '100%' }}
    >
      {/* Company Search */}
      <TextField
        fullWidth
        size="small"
        label="Search by company name"
        placeholder="Enter company name..."
        value={search}
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
      />

      {/* Level Filter */}
      <FormControl
        size="small"
        sx={{ minWidth: { xs: '100%', md: 200 } }}
      >
        <InputLabel id="company-level-filter-label">
          Level
        </InputLabel>

        <Select<number[]>
          labelId="company-level-filter-label"
          multiple
          value={levels}
          label="Level"
          onChange={(event) => {
            const value = event.target.value;

            onLevelsChange(
              typeof value === 'string'
                ? value.split(',').map(Number)
                : value,
            );
          }}
          renderValue={(selected) =>
            selected.length
              ? selected.map((level) => `Level ${level}`).join(', ')
              : 'All levels'
          }
        >
          {LEVEL_OPTIONS.map((level) => (
            <MenuItem key={level} value={level}>
              <Checkbox checked={levels.includes(level)} />
              <ListItemText primary={`Level ${level}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
