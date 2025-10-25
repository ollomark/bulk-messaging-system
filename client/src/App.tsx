import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import SmsCampaigns from "./pages/SmsCampaigns";
import EmailCampaigns from "./pages/EmailCampaigns";
import Dealers from "./pages/Dealers";
import ImportNumbers from "./pages/ImportNumbers";
import AllNumbers from "./pages/AllNumbers";
import AllSmsCampaigns from "./pages/AllSmsCampaigns";
import AllEmailCampaigns from "./pages/AllEmailCampaigns";
import Settings from "./pages/Settings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/groups"} component={Groups} />
      <Route path={"/sms-campaigns"} component={SmsCampaigns} />
      <Route path={"/email-campaigns"} component={EmailCampaigns} />
      <Route path={"/dealers"} component={Dealers} />
      <Route path={"/import-numbers"} component={ImportNumbers} />
      <Route path={"/all-numbers"} component={AllNumbers} />
      <Route path={"/all-sms"} component={AllSmsCampaigns} />
      <Route path={"/all-emails"} component={AllEmailCampaigns} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
