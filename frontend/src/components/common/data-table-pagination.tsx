
'use client';

import { useState } from 'react';

import {
  Button,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface DataTablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  disabled?: boolean;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface PageJumpProps {
  currentPage: number;
  pageCount: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}

function PageJump({
  currentPage,
  pageCount,
  disabled,
  onPageChange,
}: PageJumpProps) {
  const [inputPage, setInputPage] = useState(
    String(currentPage),
  );

  const targetPage = Number(inputPage);

  const isValid =
    /^\d+$/.test(inputPage) &&
    Number.isSafeInteger(targetPage) &&
    targetPage >= 1 &&
    targetPage <= pageCount;

  const handleJump = () => {
    if (isValid) {
      onPageChange(targetPage - 1);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center' }}
    >
      <Typography variant="body2" color="text.secondary">
        Go to
      </Typography>

      <TextField
        size="small"
        type="number"
        value={inputPage}
        onChange={(event) => setInputPage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleJump();
          }
        }}
        disabled={disabled || pageCount === 0}
        slotProps={{
          htmlInput: {
            min: 1,
            max: pageCount,
            step: 1,
            'aria-label': 'Page number',
          },
        }}
        sx={{ width: 76 }}
      />

      <Button
        size="small"
        variant="outlined"
        disabled={
          disabled ||
          !isValid ||
          targetPage === currentPage
        }
        onClick={handleJump}
      >
        Go
      </Button>
    </Stack>
  );
}

export default function DataTablePagination({
  total,
  page,
  pageSize,
  disabled = false,
  rowsPerPageOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const pageCount = Math.ceil(total / pageSize);
  const currentPage = page + 1;

  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{
        px: 2,
        py: 2,
        justifyContent: 'space-between',
        alignItems: {
          xs: 'stretch',
          md: 'center',
        },
      }}
    >
      {/* Rows per page and record count */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center' }}
      >
        <Typography variant="body2" color="text.secondary">
          Rows per page
        </Typography>

        <Select
          size="small"
          value={pageSize}
          disabled={disabled}
          onChange={(event) =>
            onPageSizeChange(Number(event.target.value))
          }
        >
          {rowsPerPageOptions.map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </Select>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: 'nowrap' }}
        >
          {start}-{end} of {total}
        </Typography>
      </Stack>

      {/* Page navigation */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center' }}
      >
        {pageCount > 0 && (
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, value) => onPageChange(value - 1)}
            disabled={disabled}
            showFirstButton
            showLastButton
            boundaryCount={1}
            siblingCount={1}
            size="small"
          />
        )}

        <PageJump
          key={page}
          currentPage={currentPage}
          pageCount={pageCount}
          disabled={disabled}
          onPageChange={onPageChange}
        />
      </Stack>
    </Stack>
  );
}
