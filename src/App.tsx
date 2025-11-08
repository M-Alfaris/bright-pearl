import {
  Refine,
  GitHubBanner,
  WelcomePage,
  Authenticated,
} from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  useNotificationProvider,
  ThemedLayout,
  ThemedSider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { dataProvider, liveProvider } from "@refinedev/supabase";
import { App as AntdApp } from "antd";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import {
  ReportList,
  ReportCreate,
  ReportEdit,
  ReportShow,
} from "./pages/reports";
import { ModeratorPendingList } from "./pages/moderator";
import { PublicDashboard } from "./pages/public-dashboard";
import { LandingPage } from "./pages/landing";
import { Statistics } from "./pages/statistics";
import { About } from "./pages/about";
import { Policies } from "./pages/policies";
import { AppIcon } from "./components/app-icon";
import { supabaseClient } from "./utility";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { Header } from "./components/header";
import { PublicLayout } from "./components/public-layout";
import authProvider from "./authProvider";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider(supabaseClient)}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerProvider}
                notificationProvider={useNotificationProvider}
                resources={[
                  {
                    name: "reports",
                    list: "/reports",
                    create: "/reports/create",
                    edit: "/reports/edit/:id",
                    show: "/reports/show/:id",
                    meta: {
                      canDelete: true,
                      label: "All Reports",
                    },
                  },
                  {
                    name: "moderator",
                    list: "/moderator/pending",
                    meta: {
                      label: "Moderator Queue",
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "rg8npt-sh70sB-8ryogN",
                  title: { text: "Bright Pearl", icon: <AppIcon /> },
                }}
              >
                <Routes>
                  {/* Public Routes - No authentication required */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/reports/create" element={<PublicLayout><ReportCreate /></PublicLayout>} />
                  <Route path="/reports/public" element={<PublicLayout><PublicDashboard /></PublicLayout>} />
                  <Route path="/statistics" element={<PublicLayout><Statistics /></PublicLayout>} />
                  <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
                  <Route path="/policies" element={<PublicLayout><Policies /></PublicLayout>} />

                  {/* Authenticated Routes - Login required */}
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout
                          Header={Header}
                          Sider={(props) => <ThemedSider {...props} fixed />}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route path="/reports">
                      <Route index element={<ReportList />} />
                      <Route path="edit/:id" element={<ReportEdit />} />
                      <Route path="show/:id" element={<ReportShow />} />
                    </Route>
                    <Route path="/moderator">
                      <Route path="pending" element={<ModeratorPendingList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>

                  {/* Auth Routes */}
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route
                      path="/login"
                      element={
                        <AuthPage
                          type="login"
                          title="Bright Pearl - Moderator Login"
                        />
                      }
                    />
                    <Route
                      path="/register"
                      element={<AuthPage type="register" />}
                    />
                    <Route
                      path="/forgot-password"
                      element={<AuthPage type="forgotPassword" />}
                    />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
