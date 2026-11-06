'use client';

import { useRef, useState, type FormEvent } from 'react';
import NextLink from 'next/link';

import { signupByEmail } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

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
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';

interface SignupErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Match the backend class-validator MinLength/MaxLength character counting.
function getValidationLength(value: string): number {
  const surrogatePairs = value.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0;
  const presentationSequences = value.match(/[^\uFE0F\uFE0E][\uFE0F\uFE0E]/g)?.length ?? 0;
  return value.length - surrogatePairs - presentationSequences;
}

export default function SignupPage() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});

  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  // Clear one field's error
  const clearFieldError = (field: keyof SignupErrors) => {
    setErrors((prev) => ({
        ...prev,
        [field]: undefined,
    }));
    setSuccessMessage('');
    setApiError('');
  };

  // Validate signup form
  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {};
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const nameLength = getValidationLength(trimmedName);
    const passwordLength = getValidationLength(password);

    // Name validation
    if(!trimmedName) {
        newErrors.name = 'Name is required.';
    }else if(nameLength < 2) {
        newErrors.name = 'Name must contain at least 2 characters.';
    }else if(nameLength > 100) {
        newErrors.name = 'Name must not exceed 100 characters.';
    }

    // Email validation
    if (!trimmedEmail) {
      newErrors.email = 'Email is required.';
    } else if (trimmedEmail.length > 254) {
      newErrors.email = 'Email must not exceed 254 characters.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        newErrors.email = 'Please enter a valid email address.';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (passwordLength > 128) {
      newErrors.password = 'Password must not exceed 128 characters.';
    } else if (passwordLength < 8) {
      newErrors.password = 'Password must contain at least 8 characters.';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
    const handleSubmit = async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();
      if (submissionInFlight.current) {
        return;
      }

      setSuccessMessage('');
      setApiError('');

      // Step 1: Frontend validation
      if (!validateForm()) {
        return;
      }

      // Step 2: Start submitting
      submissionInFlight.current = true;
      setIsSubmitting(true);

      try {
        // Step 3: Call backend API
        const result = await signupByEmail({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        // Step 4: Handle success response
        setSuccessMessage(result.message);

        // Clear password fields after successful registration
        setPassword('');
        setConfirmPassword('');

      } catch (error) {
        // Step 5: Handle API errors
        if (error instanceof ApiError) {
          setApiError(error.message);
        } else {
          setApiError(
            'Unable to connect to the server. Please try again.',
          );
        }
      } finally {
        // Step 6: Finish submitting
        submissionInFlight.current = false;
        setIsSubmitting(false);
      }
    };

  return (
    <Card
        elevation={3}
        sx={{
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
        }}
    >
        <CardContent
            sx={{
                p: { xs: 3, sm: 4 },
                '&:last-child': {
                    pb: { xs: 3, sm: 4 },
                },
            }}
        >
            <Stack spacing={3}>
                {/* Header */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700 }}
                    >
                        Create Account
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Sign up for your Dashboard Project
                    </Typography>
                </Box>
                { /* Feedback */}
                {successMessage && (
                  <Alert severity="success">
                    <Typography sx={{ fontWeight: 600 }}>
                      Registration Submitted
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Your account is awaiting administrator approval.
                      You will be able to sign in once your account
                      has been activated.
                    </Typography>
                  </Alert>
                )}
                {apiError && (
                    <Alert severity="error">
                        {apiError}
                    </Alert>
                )}

                {/* Signup Form */}
                {!successMessage && (
                  <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={2.5}>
                        {/* Name Field */}
                        <TextField
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                clearFieldError('name');
                            }}
                            error={Boolean(errors.name)}
                            helperText={errors.name}
                            autoComplete="name"
                            fullWidth
                        />
                        {/* Email Field */}
                        <TextField
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                clearFieldError('email');
                            }}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                            autoComplete="email"
                            fullWidth
                        />
                        {/* Password Field */}
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                clearFieldError('password');
                                clearFieldError('confirmPassword'); // Clear confirm password error when password changes
                            }}
                            error={Boolean(errors.password)}
                            helperText={
                                errors.password??
                                'Use 8-128 characters.'
                            }
                            autoComplete="new-password"
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowPassword((prev) => !prev)
                                                }
                                                edge="end"
                                                aria-label={
                                                    showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                                }
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
                        {/* Confirm Password Field */}
                        <TextField
                            label="Confirm Password"
                            type={
                                showConfirmPassword ? 'text' : 'password'
                            }
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                clearFieldError('confirmPassword');
                            }}
                            error={Boolean(errors.confirmPassword)}
                            helperText={errors.confirmPassword}
                            autoComplete="new-password"
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        (prev) => !prev,
                                                    )
                                                }
                                                edge="end"
                                                aria-label={
                                                    showConfirmPassword
                                                        ? 'Hide confirm password'
                                                        : 'Show confirm password'
                                                }
                                            >
                                                {showConfirmPassword ? (
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
                        {/* Submit */}
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{ py: 1.4 }}
                        >
                            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </Stack>
                </Box>
)}
                {/* Login Link */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Already have an account?{' '}
                        <Link
                            component={NextLink}
                            href="/login"
                            underline="hover"
                            sx={{ fontWeight: 600 }}
                        >
                            Sign In
                        </Link>
                    </Typography>
                </Box>
            </Stack>
        </CardContent>
    </Card>
  );


}
