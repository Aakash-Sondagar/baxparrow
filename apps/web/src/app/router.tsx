import { createBrowserRouter, Navigate } from "react-router-dom";
import { StoreLayout } from "../components/StoreLayout";
import { AdminLayout } from "../routes/admin/AdminLayout";
import { ProtectedAdmin } from "../routes/admin/ProtectedAdmin";
import Home from "../routes/store/Home";
import Listing from "../routes/store/Listing";
import Product from "../routes/store/Product";
import CartPage from "../routes/store/Cart";
import Checkout from "../routes/store/Checkout";
import Confirm from "../routes/store/Confirm";
import Track from "../routes/store/Track";
import Search from "../routes/store/Search";
import Contact from "../routes/store/Contact";
import About from "../routes/store/About";
import Faq from "../routes/store/Faq";
import Shipping from "../routes/store/Shipping";
import Returns from "../routes/store/Returns";
import Warranty from "../routes/store/Warranty";
import Account from "../routes/store/Account";
import AccountAuth from "../routes/store/AccountAuth";
import ForgotPassword from "../routes/store/ForgotPassword";
import ResetPassword from "../routes/store/ResetPassword";
import Dashboard from "../routes/admin/Dashboard";
import Products from "../routes/admin/Products";
import ProductForm from "../routes/admin/ProductForm";
import BulkUpload from "../routes/admin/BulkUpload";
import Orders from "../routes/admin/Orders";
import Categories from "../routes/admin/Categories";
import UiSettings from "../routes/admin/UiSettings";
export const router = createBrowserRouter([
  { path: "/", element: <StoreLayout />, children: [
    { index: true, element: <Home /> },
    { path: "shop", element: <Listing /> },
    { path: "p/:slug", element: <Product /> },
    { path: "cart", element: <CartPage /> },
    { path: "checkout", element: <Checkout /> },
    { path: "order/:no/confirmed", element: <Confirm /> },
    { path: "order/:no/track", element: <Track /> },
    { path: "search", element: <Search /> },
    { path: "contact", element: <Contact /> },
    { path: "about", element: <About /> },
    { path: "faq", element: <Faq /> },
    { path: "shipping", element: <Shipping /> },
    { path: "returns", element: <Returns /> },
    { path: "warranty", element: <Warranty /> },
    { path: "account", element: <Account /> },
    { path: "login", element: <AccountAuth /> },
    { path: "signup", element: <AccountAuth /> },
    { path: "forgot-password", element: <ForgotPassword /> },
    { path: "reset-password", element: <ResetPassword /> },
  ]},
  { path: "/admin", element: <ProtectedAdmin><AdminLayout /></ProtectedAdmin>, children: [
    { index: true, element: <Navigate to="/admin/dashboard" replace /> },
    { path: "dashboard", element: <Dashboard /> },
    { path: "products", element: <Products /> },
    { path: "products/new", element: <ProductForm /> },
    { path: "products/:id/edit", element: <ProductForm /> },
    { path: "products/bulk", element: <BulkUpload /> },
    { path: "orders", element: <Orders /> },
    { path: "categories", element: <Categories /> },
    { path: "settings", element: <UiSettings /> },
  ]},
]);
