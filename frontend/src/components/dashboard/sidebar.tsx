
'use client';

import { Fragment, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useAuth } from '@/features/auth/use-auth';

export const DRAWER_WIDTH = 260;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardOutlinedIcon />,
  },
  {
    label: 'Company',
    href: '/company',
    icon: <BusinessOutlinedIcon />,
  },
  {
    label: 'Order',
    href: '/order',
    icon: <ShoppingCartOutlinedIcon />,
  },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  // Company menu
  const companySelected =
    pathname === '/company' ||
    pathname.startsWith('/company/');

  const [companyMenuOpen, setCompanyMenuOpen] = useState(
    pathname.startsWith('/company'),
  );

  // User menu
  const userSelected =
    pathname === '/user' ||
    pathname.startsWith('/user/');

  const [userMenuOpen, setUserMenuOpen] = useState(
    pathname.startsWith('/user'),
  );


  const handleNavigation = (href: string) => {
    setCompanyMenuOpen(href.startsWith('/company'));
    setUserMenuOpen(href.startsWith('/user'));

    router.push(href);
    onClose();
  };

  const drawerContent = () => (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Workspace
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Supply Chain Management
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, px: 1 }}
        >
          MAIN MENU
        </Typography>

        <List sx={{ mt: 1 }}>

          {navigationItems.map((item) => {
            // Company Parent Menu
            if (item.label === 'Company') {
              return (
                <Fragment key={item.href}>
                  <ListItemButton
                    selected={companySelected}
                    onClick={() =>
                      setCompanyMenuOpen((previous) => !previous)
                    }
                    aria-expanded={companyMenuOpen}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      mb: 0.5,
                      bgcolor: 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      },
                      '&::after': {
                        content: '""',
                        display: companyMenuOpen ? 'block' : 'none',
                        position: 'absolute',
                        left: 28,
                        top: 'calc(50% + 12px)',
                        bottom: '-8px',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: companySelected
                          ? 'primary.main'
                          : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary="Company"
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight:
                              companySelected || companyMenuOpen ? 600 : 400,
                            color: companySelected
                              ? 'primary.main'
                              : 'text.primary',
                          },
                        },
                      }}
                    />

                    {companyMenuOpen ? (
                      <ExpandLessIcon
                        sx={{
                          color: companySelected
                            ? 'primary.main'
                            : 'text.secondary',
                        }}
                      />
                    ) : (
                      <ExpandMoreIcon
                        sx={{
                          color: companySelected
                            ? 'primary.main'
                            : 'text.secondary',
                        }}
                      />
                    )}
                  </ListItemButton>

                  {/* Company Submenus */}
                  <Collapse
                    in={companyMenuOpen}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding sx={{ mt: 0.5 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          ml: 3.5,
                          pl: 2.5,
                          py: 0.25,

                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: '21px',
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                          },
                        }}
                      >
                        {/* List */}
                        <ListItemButton
                          selected={pathname === '/company/list'}
                          onClick={() =>
                            handleNavigation('/company/list')
                          }
                          sx={{
                            minHeight: 38,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            position: 'relative',

                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: '-20px',
                              top: '50%',
                              width: '20px',
                              borderTop: '1px solid',
                              borderColor: 'divider',
                            },

                            '&.Mui-selected': {
                              bgcolor: 'action.selected',
                              color: 'primary.main',

                              '&:hover': {
                                bgcolor: 'action.selected',
                              },

                              '&::before': {
                                borderColor: 'primary.main',
                              },
                            },
                          }}
                        >
                          <ListItemText
                            primary="List"
                            slotProps={{
                              primary: {
                                sx: {
                                  fontSize: '0.875rem',
                                  fontWeight:
                                    pathname === '/company/list' ? 600 : 400,
                                  color:
                                    pathname === '/company/list'
                                      ? 'primary.main'
                                      : 'text.secondary',
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      </Box>
                    </List>
                  </Collapse>
                </Fragment>
              );
            }

            // Normal Navigation Items
            const selected =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <ListItemButton
                key={item.href}
                selected={selected}
                onClick={() => handleNavigation(item.href)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: selected ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: { fontWeight: selected ? 600 : 400 },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}


          {/* User Parent Menu */}
          <ListItemButton
            selected={userSelected}
            onClick={() => setUserMenuOpen((previous) => !previous)}
            aria-expanded={userMenuOpen}
            sx={{
              position: 'relative',
              borderRadius: 2,
              mb: 0.5,
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              },
              // Continue below the icon across the parent/submenu gap.
              // This segment sits outside Collapse so its animation cannot clip it.
              '&::after': {
                content: '""',
                display: userMenuOpen ? 'block' : 'none',
                position: 'absolute',
                left: 28,
                top: 'calc(50% + 12px)',
                bottom: '-8px',
                borderLeft: '1px solid',
                borderColor: 'divider',
                pointerEvents: 'none',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: userSelected ? 'primary.main' : 'text.secondary',
              }}
            >
              <PeopleAltOutlinedIcon />
            </ListItemIcon>

            <ListItemText
              primary="User"
              slotProps={{
                primary: {
                  sx: {
                    fontWeight: userSelected || userMenuOpen ? 600 : 400,
                    color: userSelected ? 'primary.main' : 'text.primary',
                  },
                },
              }}
            />

            {userMenuOpen ? (
              <ExpandLessIcon sx={{ color: userSelected ? 'primary.main' : 'text.secondary' }} />
            ) : (
              <ExpandMoreIcon sx={{ color: userSelected ? 'primary.main' : 'text.secondary' }} />
            )}
          </ListItemButton>

          {/* User Submenus */}
          <Collapse in={userMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  position: 'relative',
                  ml: 3.5,
                  pl: 2.5,
                  py: 0.25,

                  // Vertical tree connector
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: '21px',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                {/* Profile */}
                <ListItemButton
                  selected={pathname === '/user/profile'}
                  onClick={() => handleNavigation('/user/profile')}
                  sx={{
                    minHeight: 38,
                    px: 1.5,
                    py: 0.5,
                    mb: isAdmin ? 0.5 : 0,
                    borderRadius: 1.5,
                    position: 'relative',

                    // Horizontal branch
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '-20px',
                      top: '50%',
                      width: '20px',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    },

                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      color: 'primary.main',

                      '&:hover': {
                        bgcolor: 'action.selected',
                      },

                      '&::before': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Profile"
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.875rem',
                          fontWeight:
                            pathname === '/user/profile' ? 600 : 400,
                          color:
                            pathname === '/user/profile'
                              ? 'primary.main'
                              : 'text.secondary',
                        },
                      },
                    }}
                  />
                </ListItemButton>

                {/* List - ADMIN only */}
                {isAdmin && (
                  <ListItemButton
                    selected={pathname === '/user/list'}
                    onClick={() => handleNavigation('/user/list')}
                    sx={{
                      minHeight: 38,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      position: 'relative',

                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-20px',
                        top: '50%',
                        width: '20px',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      },

                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        color: 'primary.main',

                        '&:hover': {
                          bgcolor: 'action.selected',
                        },

                        '&::before': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary="List"
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.875rem',
                            fontWeight:
                              pathname === '/user/list' ? 600 : 400,
                            color:
                              pathname === '/user/list'
                                ? 'primary.main'
                                : 'text.secondary',
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                )}
              </Box>
            </List>
          </Collapse>

        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: 64,
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {drawerContent()}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent()}
      </Drawer>
    </>
  );
}
