import {
  createTheme,
  Button,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Menu,
  Modal,
  ActionIcon,
  Tooltip,
  type MantineColorsTuple,
} from '@mantine/core'
import { noctuaColors } from './palette'

const primary: MantineColorsTuple = [
  noctuaColors.noctuadark[50],
  noctuaColors.noctuadark[100],
  noctuaColors.noctuadark[200],
  noctuaColors.noctuadark[300],
  noctuaColors.noctuadark[400],
  noctuaColors.noctuadark[500],
  noctuaColors.noctuadark[600],
  noctuaColors.noctuadark[700],
  noctuaColors.noctuadark[800],
  noctuaColors.noctuadark[900],
]

const accent: MantineColorsTuple = [
  noctuaColors.noctuaAccent[50],
  noctuaColors.noctuaAccent[100],
  noctuaColors.noctuaAccent[200],
  noctuaColors.noctuaAccent[300],
  noctuaColors.noctuaAccent[400],
  noctuaColors.noctuaAccent[500],
  noctuaColors.noctuaAccent[600],
  noctuaColors.noctuaAccent[700],
  noctuaColors.noctuaAccent[800],
  noctuaColors.noctuaAccent[900],
]

export const mantineTheme = createTheme({
  primaryColor: 'primary',
  primaryShade: 5,
  colors: { primary, accent },
  defaultRadius: 'sm',
  fontFamily:
    'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Oxygen, Ubuntu, Cantarell, sans-serif',
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  headings: {
    fontWeight: '500',
  },
  components: {
    Button: Button.extend({
      defaultProps: {
        size: 'xs',
      },
      styles: {
        root: { textTransform: 'none' },
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'subtle',
        color: 'gray',
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        size: 'xs',
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        size: 'xs',
      },
    }),
    Select: Select.extend({
      defaultProps: {
        size: 'xs',
        allowDeselect: false,
        comboboxProps: { withinPortal: true },
      },
    }),
    Checkbox: Checkbox.extend({
      defaultProps: {
        size: 'sm',
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        withArrow: true,
        openDelay: 200,
        transitionProps: { transition: 'fade', duration: 150 },
      },
    }),
    Menu: Menu.extend({
      styles: {
        dropdown: {
          backgroundColor: noctuaColors.noctuadark[100],
          color: noctuaColors.noctuadark[900],
        },
        item: {
          color: noctuaColors.noctuadark[900],
        },
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        withCloseButton: false,
        padding: 0,
        radius: 'md',
        overlayProps: { backgroundOpacity: 0.4, blur: 1 },
        transitionProps: { transition: 'pop', duration: 150 },
      },
    }),
  },
})
