
'use client';

import { usePathname, useRouter } from 'next/navigation';

import {
    Box,
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
    {
        label: 'User',
        href: '/user',
        icon: <PeopleAltOutlinedIcon />,
    },
];

export default function Sidebar({
    mobileOpen,
    onClose,
}: SidebarProps) {

    const pathname = usePathname();
    const router = useRouter();

    const handleNavigation = (href: string) => {
        router.push(href);
        onClose();
    };

    const drawerContent = () => (
        <Box sx={{ overflow: 'auto', height: '100%' }}>

            <Box sx={{ px: 3, py: 3 }}>
                <Typography
                    variant="subtitle1"
                    fontWeight={700}
                >
                    Workspace
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    Supply Chain Management
                </Typography>
            </Box>

            <Divider />

            <Box sx={{ px: 2, py: 2 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ px: 1 }}
                >
                    MAIN MENU
                </Typography>

                <List sx={{ mt: 1 }}>

                    {navigationItems.map((item) => {

                        const selected =
                            pathname === item.href ||
                            (
                                item.href !== '/dashboard' &&
                                pathname.startsWith(`${item.href}/`)
                            );

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
                                    '&.Mui-selected:hover': {
                                        bgcolor: 'action.selected',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: selected
                                            ? 'primary.main'
                                            : 'text.secondary',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>

                                <ListItemText
                                    primary={item.label}
                                    slotProps={{
                                        primary: {
                                            fontWeight: selected ? 600 : 400,
                                        },
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}

                </List>
            </Box>
        </Box>
    );

    return (
        <>
            {/* Desktop Sidebar */}
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

            {/* Mobile Sidebar */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{
                    keepMounted: true,
                }}
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
