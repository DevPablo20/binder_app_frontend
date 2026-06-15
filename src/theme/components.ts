import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      body: {
        backgroundColor: theme.palette.background.default,
      },
    }),
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: 'none',
        backgroundImage: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        boxShadow: 'none',
        backgroundImage: 'none',
        borderRight: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiButton: {
    variants: [
      {
        props: { variant: 'contained', color: 'primary' },
        style: ({ theme }) => ({
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
          },
        }),
      },
    ],
  },
};
