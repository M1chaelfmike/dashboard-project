'use client';

import { useEffect, useState, type ElementType } from 'react';

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { alpha, useTheme } from '@mui/material/styles';

import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';

import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

import {
  getRecentActivities,
  type RecentActivity,
} from '@/lib/api/dashboard';

// ==================== Types ====================

type ActivityColor =
  | 'success'
  | 'error'
  | 'info'
  | 'warning';

interface ActionMeta {
  label: string;
  color: ActivityColor;
  Icon: ElementType;
}

// ==================== Action Metadata ====================

const ACTION_META: Record<string, ActionMeta> = {
  CREATE_USER: {
    label: 'Created',
    color: 'success',
    Icon: AddRoundedIcon,
  },
  UPDATE_USER: {
    label: 'Updated',
    color: 'info',
    Icon: EditOutlinedIcon,
  },
  DELETE_USER: {
    label: 'Deleted',
    color: 'error',
    Icon: DeleteOutlineRoundedIcon,
  },
  BULK_DELETE_USERS: {
    label: 'Bulk Deleted',
    color: 'error',
    Icon: DeleteOutlineRoundedIcon,
  },
  APPROVE_USER: {
    label: 'Approved',
    color: 'success',
    Icon: CheckRoundedIcon,
  },
  REJECT_USER: {
    label: 'Rejected',
    color: 'error',
    Icon: CloseRoundedIcon,
  },
  SUSPEND_USER: {
    label: 'Suspended',
    color: 'warning',
    Icon: BlockOutlinedIcon,
  },
  REACTIVATE_USER: {
    label: 'Reactivated',
    color: 'success',
    Icon: ReplayRoundedIcon,
  },

  CREATE_COMPANY: {
    label: 'Created',
    color: 'success',
    Icon: AddRoundedIcon,
  },
  UPDATE_COMPANY: {
    label: 'Updated',
    color: 'info',
    Icon: EditOutlinedIcon,
  },
  DELETE_COMPANY: {
    label: 'Deleted',
    color: 'error',
    Icon: DeleteOutlineRoundedIcon,
  },
};

const DEFAULT_ACTION: ActionMeta = {
  label: 'Activity',
  color: 'info',
  Icon: HistoryOutlinedIcon,
};

// ==================== Date Formatter ====================

function formatActivityDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const activityDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (activityDay.getTime() === today.getTime()) {
    return `Today, ${time}`;
  }

  if (activityDay.getTime() === yesterday.getTime()) {
    return `Yesterday, ${time}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear()
      ? { year: 'numeric' as const }
      : {}),
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

// ==================== Component ====================

export default function RecentActivities() {
  const theme = useTheme();

  const [activities, setActivities] =
    useState<RecentActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getRecentActivities();

        if (!cancelled) {
          setActivities(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load recent activities.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchActivities();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Recent Activities
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Latest activities across your system.
          </Typography>
        </Box>

        {/* Loading */}
        {loading && (
          <Box
            sx={{
              minHeight: 170,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && activities.length === 0 && (
          <Box
            sx={{
              minHeight: 170,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <HistoryOutlinedIcon
              sx={{
                fontSize: 42,
                color: 'text.disabled',
              }}
            />

            <Typography sx={{ fontWeight: 600 }}>
              No recent activities yet
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Activity records will appear here when available.
            </Typography>
          </Box>
        )}

        {/* Activity List */}
        {!loading && !error && activities.length > 0 && (
          <Stack
            divider={<Divider flexItem />}
            spacing={0}
          >
            {activities.map((activity) => {
              const isCompany =
                activity.targetType === 'COMPANY';

              const MainIcon = isCompany
                ? BusinessOutlinedIcon
                : PersonOutlineOutlinedIcon;

              const action =
                ACTION_META[activity.action] ??
                DEFAULT_ACTION;

              const ActionIcon = action.Icon;

              const categoryColor = isCompany
                ? theme.palette.secondary.main
                : theme.palette.primary.main;

              const actionColor =
                theme.palette[action.color].main;

              const target =
                activity.targetName ??
                activity.targetId ??
                'Unknown target';

              const isSuccess =
                activity.result === 'SUCCESS';

              return (
                <Box
                  key={activity.id}
                  sx={{
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.75,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Main Icon + Action Badge */}
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2.5,
                      color: categoryColor,
                      bgcolor: alpha(categoryColor, 0.08),
                      border: '1px solid',
                      borderColor: alpha(categoryColor, 0.18),
                    }}
                  >
                    <MainIcon sx={{ fontSize: 25 }} />

                    <Box
                      sx={{
                        position: 'absolute',
                        right: -5,
                        bottom: -5,
                        width: 21,
                        height: 21,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        color: actionColor,
                        border: '1.5px solid',
                        borderColor: actionColor,
                      }}
                    >
                      <ActionIcon sx={{ fontSize: 14 }} />
                    </Box>
                  </Box>

                  {/* Activity Information */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 180,
                    }}
                  >
                    {/* Actor + Role */}
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.8,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                      >
                        {activity.actorName || 'System'}
                      </Typography>

                      {activity.actorRole && (
                        <Chip
                          label={activity.actorRole}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            color:
                              activity.actorRole === 'ADMIN'
                                ? theme.palette.primary.dark
                                : theme.palette.text.secondary,
                            borderColor:
                              activity.actorRole === 'ADMIN'
                                ? alpha(
                                    theme.palette.primary.main,
                                    0.4,
                                  )
                                : theme.palette.divider,
                            bgcolor:
                              activity.actorRole === 'ADMIN'
                                ? alpha(
                                    theme.palette.primary.main,
                                    0.07,
                                  )
                                : 'transparent',
                          }}
                        />
                      )}
                    </Stack>

                    {/* Action + Target Category + Target Name */}
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.8,
                        mt: 0.8,
                      }}
                    >
                      <Chip
                        label={action.label}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 24,
                          borderRadius: 1.5,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: actionColor,
                          borderColor: alpha(actionColor, 0.4),
                          bgcolor: alpha(actionColor, 0.08),
                        }}
                      />

                      <Chip
                        label={isCompany ? 'COMPANY' : 'USER'}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 24,
                          borderRadius: 1.5,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: categoryColor,
                          borderColor: alpha(categoryColor, 0.4),
                          bgcolor: alpha(categoryColor, 0.08),
                        }}
                      />

                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{
                          fontWeight: 500,
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {target}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Result + Time */}
                  <Stack
                    direction={{ xs: 'row', sm: 'column' }}
                    spacing={{ xs: 1, sm: 0.5 }}
                    sx={{
                      alignItems: {
                        xs: 'center',
                        sm: 'flex-end',
                      },
                      justifyContent: 'space-between',
                      ml: { xs: '62px', sm: 0 },
                      flexShrink: 0,
                      minWidth: { sm: 125 },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.6}
                      sx={{
                        alignItems: 'center',
                        color: isSuccess
                          ? 'success.main'
                          : 'error.main',
                      }}
                    >
                      {isSuccess ? (
                        <CheckCircleOutlineRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      ) : (
                        <ErrorOutlineRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      )}

                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700 }}
                      >
                        {isSuccess ? 'Success' : 'Failed'}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {formatActivityDate(activity.createdAt)}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}