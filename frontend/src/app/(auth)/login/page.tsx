
'use client';

import { useState, type FormEvent } from 'react';
import NextLink from 'next/link';

import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api/client';

import { useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface LoginErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formMessage, setFormMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormMessage('');
    setApiError('');

    // 1. Frontend validation
    if (!validateForm()) {
      return;
    }

    // 2. Call backend login api
    setIsSubmitting(true);
    try{
      await login({
        email: email.trim(),
        password,
      });
      // 3. Login successful
      setPassword('');
      router.replace('/dashboard');

    }catch(error){
      // 4. Handle API error
      if(error instanceof ApiError){
        setApiError(error.message);
      }else{
        setApiError('Unable to connect to the server. Please try again.');
      }
    }finally{
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: { xs: 3, sm: 5 },
          '&:last-child': {
            pb: { xs: 3, sm: 5 },
          },
        }}
      >
        <Stack spacing={3}>
          {/* Page Header */}
          <Box
            sx={{textAlign:"center"}}>
            <Typography
            variant="h4"
            sx={{ fontWeight: 700 }}
            >
              Welcome Back
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Sign in to your Dashboard Project
            </Typography>
          </Box>

          {/* Feedback */}
          {formMessage && (
            <Alert severity="success">
              {formMessage}
            </Alert>
          )}
          {apiError && (
            <Alert severity="error">
              {apiError}
            </Alert>
          )}

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
          >
            <Stack spacing={2.5}>
              <TextField
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined,
                  }));
                  setApiError('');
                  setFormMessage('');
                }}
                error={Boolean(errors.email)}
                helperText={errors.email}
                autoComplete="email"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
                  setApiError('');
                  setFormMessage('');
                }}
                error={Boolean(errors.password)}
                helperText={errors.password}
                autoComplete="current-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPassword((prev) => !prev)
                          }
                          edge="end"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{ py: 1.4 }}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          {/* Sign Up Link */}
          <Box
            sx = {{textAlign:"center"}}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Don&apos;t have an account?{' '}
              <Link
                component={NextLink}
                href="/signup"
                underline="hover"
                sx = {{fontWeight:600}}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
