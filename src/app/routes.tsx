import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Conversation } from "./pages/Conversation";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/conversation",
    Component: Conversation,
  },
]);
