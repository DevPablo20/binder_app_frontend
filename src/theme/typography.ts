import type { TypographyVariantsOptions } from '@mui/material/styles';

const montserrat = '"Montserrat", Verdana, sans-serif';
const dmSerifDisplay = '"DM Serif Display", serif';

export const typography: TypographyVariantsOptions = {
  fontFamily: montserrat,
  h1: {
    fontFamily: dmSerifDisplay,
    fontWeight: 400,
    fontSize: '2.5rem',
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: dmSerifDisplay,
    fontWeight: 400,
    fontSize: '2rem',
    lineHeight: 1.25,
  },
  h3: {
    fontFamily: dmSerifDisplay,
    fontWeight: 400,
    fontSize: '1.75rem',
    lineHeight: 1.3,
  },
  h4: {
    fontFamily: dmSerifDisplay,
    fontWeight: 400,
    fontSize: '1.5rem',
    lineHeight: 1.35,
  },
  body1: {
    fontFamily: montserrat,
    fontSize: 14,
    lineHeight: 1.5,
  },
  body2: {
    fontFamily: montserrat,
    fontSize: 13,
    lineHeight: 1.43,
  },
  button: {
    fontFamily: montserrat,
    fontWeight: 500,
    fontSize: 14,
    textTransform: 'none',
  },
  caption: {
    fontFamily: montserrat,
    fontSize: 12,
    lineHeight: 1.66,
  },
};
