import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import FlightResults from "./pages/FlightResults";
import Booking from "./pages/Booking";
import MyTickets from "./pages/MyTickets";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: Login,
  },
  {
    path: "/email-code",
    Component: Login,
  },
  {
    path: "/verify-email",
    Component: Login,
  },
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/flights",
    Component: FlightResults,
  },
  {
    path: "/booking/:flightId",
    element: (
      <ProtectedRoute>
        <Booking />
      </ProtectedRoute>
    ),
  },
  {
    path: "/my-tickets",
    element: (
      <ProtectedRoute>
        <MyTickets />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
