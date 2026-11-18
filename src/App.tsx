import type React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import Layout from './app/layout/Layout'
import LandingPage from './app/LandingPage'
import { mantineTheme } from './@noctua.core/theme/mantineTheme'
import SplashScreen from './features/users/components/SplashScreen'
import { AuthProvider } from './features/auth/authProvider'
import GlobalDialog from './@noctua.core/components/dialog/GlobalDialog'
import { DialogComponent } from './@noctua.core/components/dialog/dialogSlice'
import GlobalToast from './@noctua.core/components/toast/GlobalToast'
import CopyModelDialog from './features/models/components/CopyModelDialog'

const DIALOG_COMPONENTS: Partial<Record<DialogComponent, React.ComponentType<any>>> = {
  [DialogComponent.COPY_MODEL_DIALOG]: CopyModelDialog,
}

const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [{ path: '', element: <LandingPage /> }],
  },
]

const router = createBrowserRouter(routes, {
  basename: import.meta.env.VITE_BASE_URL,
})

const App: React.FC = () => {
  return (
    <MantineProvider theme={mantineTheme}>
      <Notifications />
      <AuthProvider>
        <SplashScreen>
          <RouterProvider router={router} />
          <GlobalDialog componentMap={DIALOG_COMPONENTS} />
          <GlobalToast />
        </SplashScreen>
      </AuthProvider>
    </MantineProvider>
  )
}

export default App
