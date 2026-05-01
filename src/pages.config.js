/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import HopperDashboard from './pages/HopperDashboard';
import AddTool from './pages/AddTool';
import BecomeHopper from './pages/BecomeHopper';
import Bookings from './pages/Bookings';
import Browse from './pages/Browse';
import HopperSubscription from './pages/HopperSubscription';
import HowItWorks from './pages/HowItWorks';
import Messages from './pages/Messages';
import MyTools from './pages/MyTools';
import Profile from './pages/Profile';
import RenterPass from './pages/RenterPass';
import ToolDetail from './pages/ToolDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "AddTool": AddTool,
    "BecomeHopper": BecomeHopper,
    "Bookings": Bookings,
    "Browse": Browse,
    "HopperSubscription": HopperSubscription,
    "HowItWorks": HowItWorks,
    "Messages": Messages,
    "MyTools": MyTools,
    "Profile": Profile,
    "RenterPass": RenterPass,
    "ToolDetail": ToolDetail,
    "HopperDashboard": HopperDashboard,
    "Login": Login,
    "Signup": Signup,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: __Layout,
};
