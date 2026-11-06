
'use client';

import { useState } from 'react';

import {
    AppBar,
    Avatar,
    Box,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import { useTheme, useColorScheme } from '@mui/material/styles';

import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

import type { AuthUser } from '@/lib/api/auth';

import { DRAWER_WIDTH } from './sidebar';

import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import BrightnessAutoOutlinedIcon from '@mui/icons-material/BrightnessAutoOutlined';

interface HeaderProps {
    user: AuthUser | null;
    onMenuClick: () => void;
    onLogout: () => void | Promise<void>;
    isLoggingOut: boolean;
}

type ThemeMode = 'light' | 'dark' | 'system';

export default function Header({
    user,
    onMenuClick,
    onLogout,
    isLoggingOut,
}: HeaderProps) {

    const theme = useTheme();

    const { mode, setMode } = useColorScheme();

    const [anchorEl, setAnchorEl] =
        useState<HTMLElement | null>(null);

    const [themeAnchorEl, setThemeAnchorEl] =
        useState<HTMLElement | null>(null);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleThemeMenuClose = () => {
        setThemeAnchorEl(null);
    };


    const handleLogout = () => {
        handleMenuClose();
        void onLogout();
    };

    const handleThemeChange = (newMode: ThemeMode) => {
        setMode(newMode);
        handleThemeMenuClose();
    };

    const themeIcon =
        mode === 'dark'
        ? <DarkModeOutlinedIcon />
        : mode === 'light'
        ? <LightModeOutlinedIcon />
        : <BrightnessAutoOutlinedIcon />;

    return (
        <AppBar
            position="fixed"
            color="inherit"
            elevation={0}
            sx={{
                zIndex: theme.zIndex.drawer + 1,
                width: {
                    md: `calc(100% - ${DRAWER_WIDTH}px)`,
                },
                ml: {
                    md: `${DRAWER_WIDTH}px`,
                },
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            <Toolbar>

                {/* Mobile Menu */}
                <IconButton
                    edge="start"
                    onClick={onMenuClick}
                    sx={{
                        mr: 2,
                        display: { md: 'none' },
                    }}
                    aria-label="Open navigation"
                >
                    <MenuIcon />
                </IconButton>

                {/* Project Name */}
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                    noWrap
                >
                    Dashboard Project
                </Typography>

                <Box sx={{ flexGrow: 1 }} />
                {/* Theme Menu */}
                <Tooltip title="Appearance">
                    <IconButton
                        onClick={(event) =>
                            setThemeAnchorEl(event.currentTarget)
                        }
                        aria-label="Change appearance"
                    >
                        {themeIcon}
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={themeAnchorEl}
                    open={Boolean(themeAnchorEl)}
                    onClose={handleThemeMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem
                        selected={mode === 'system'}
                        onClick={() => handleThemeChange('system')}
                    >
                        <BrightnessAutoOutlinedIcon
                            fontSize="small"
                            sx={{ mr: 1 }}
                        />
                        System
                    </MenuItem>
                    <MenuItem
                        selected={mode === 'light'}
                        onClick={() => handleThemeChange('light')}
                    >
                        <LightModeOutlinedIcon
                            fontSize="small"
                            sx={{ mr: 1 }}
                        />
                        Light
                    </MenuItem>
                    <MenuItem
                        selected={mode === 'dark'}
                        onClick={() => handleThemeChange('dark')}
                    >
                        <DarkModeOutlinedIcon
                            fontSize="small"
                            sx={{ mr: 1 }}
                        />
                        Dark
                    </MenuItem>
                </Menu>

                {/* User Menu */}
                <Tooltip title="Account">
                    <IconButton
                        onClick={(event) =>
                            setAnchorEl(event.currentTarget)
                        }
                        size="small"
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: 'primary.main',
                                fontSize: 15,
                            }}
                        >
                            {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                        </Avatar>
                    </IconButton>
                </Tooltip>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem disabled>
                        {user?.email ?? 'Account'}
                    </MenuItem>

                    <Divider />

                    <MenuItem
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogoutIcon
                            fontSize="small"
                            sx={{ mr: 1 }}
                        />

                        {isLoggingOut
                            ? 'Signing Out...'
                            : 'Logout'}
                    </MenuItem>
                </Menu>

            </Toolbar>
        </AppBar>
    );
}
