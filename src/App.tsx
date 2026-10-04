import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration } from 'react-router';
import { BASENAME } from '@/lib/paths';
import { Toaster, toast } from 'sonner';
import { SiteLayout } from '@/site/layout/SiteLayout';
import { useDb } from '@/store/db';
import { useUi } from '@/store/ui';
import { applyBrand } from '@/lib/color';
import { startCrossTabSync } from '@/store/sync';

// Storefront pages (eager — instant navigation)
import Home from '@/site/pages/Home';
import Shop from '@/site/pages/Shop';
import ProductPage from '@/site/pages/ProductPage';
import CartPage from '@/site/pages/CartPage';
import Checkout from '@/site/pages/Checkout';
import OrderSuccess from '@/site/pages/OrderSuccess';
import Services from '@/site/pages/Services';
import Projects from '@/site/pages/Projects';
import About from '@/site/pages/About';
import Contact from '@/site/pages/Contact';
import Blog from '@/site/pages/Blog';
import PostPage from '@/site/pages/PostPage';
import CmsPageView from '@/site/pages/CmsPageView';
import SearchPage from '@/site/pages/SearchPage';
import Wishlist from '@/site/pages/Wishlist';
import NotFound from '@/site/pages/NotFound';

// CMS (lazy — separate bundle)
const AdminLayout = lazy(() => import('@/admin/layout/AdminLayout'));
const Login = lazy(() => import('@/admin/pages/Login'));
const Dashboard = lazy(() => import('@/admin/pages/Dashboard'));
const Orders = lazy(() => import('@/admin/pages/Orders'));
const OrderDetail = lazy(() => import('@/admin/pages/OrderDetail'));
const Invoice = lazy(() => import('@/admin/pages/Invoice'));
const Products = lazy(() => import('@/admin/pages/Products'));
const ProductEdit = lazy(() => import('@/admin/pages/ProductEdit'));
const Categories = lazy(() => import('@/admin/pages/Categories'));
const Customers = lazy(() => import('@/admin/pages/Customers'));
const Inquiries = lazy(() => import('@/admin/pages/Inquiries'));
const ContentEditor = lazy(() => import('@/admin/pages/ContentEditor'));
const Pages = lazy(() => import('@/admin/pages/Pages'));
const PageEdit = lazy(() => import('@/admin/pages/PageEdit'));
const Posts = lazy(() => import('@/admin/pages/Posts'));
const PostEdit = lazy(() => import('@/admin/pages/PostEdit'));
const ProjectsAdmin = lazy(() => import('@/admin/pages/ProjectsAdmin'));
const Media = lazy(() => import('@/admin/pages/Media'));
const Coupons = lazy(() => import('@/admin/pages/Coupons'));
const SettingsPage = lazy(() => import('@/admin/pages/SettingsPage'));

function Loader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-brand-600" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const authed = useUi((s) => s.adminAuthed);
  if (!authed) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function Root() {
  const brand = useDb((s) => s.settings.brandColor);
  useEffect(() => applyBrand(brand), [brand]);
  useEffect(() => startCrossTabSync(), []);
  useEffect(() => {
    const fn = () => toast.error('Prostor za demo podatke je pun — obrišite neke otpremljene slike ili resetujte demo.');
    window.addEventListener('selca:storage-full', fn);
    return () => window.removeEventListener('selca:storage-full', fn);
  }, []);
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<Loader />}>
        <Outlet />
      </Suspense>
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'proizvodi', element: <Shop /> },
          { path: 'proizvodi/:category', element: <Shop /> },
          { path: 'proizvod/:slug', element: <ProductPage /> },
          { path: 'korpa', element: <CartPage /> },
          { path: 'placanje', element: <Checkout /> },
          { path: 'narudzba/:id', element: <OrderSuccess /> },
          { path: 'usluge', element: <Services /> },
          { path: 'projekti', element: <Projects /> },
          { path: 'o-nama', element: <About /> },
          { path: 'kontakt', element: <Contact /> },
          { path: 'savjeti', element: <Blog /> },
          { path: 'savjeti/:slug', element: <PostPage /> },
          { path: 'stranica/:slug', element: <CmsPageView /> },
          { path: 'pretraga', element: <SearchPage /> },
          { path: 'lista-zelja', element: <Wishlist /> },
          { path: '*', element: <NotFound /> },
        ],
      },
      { path: 'admin/login', element: <Login /> },
      {
        path: 'admin/faktura/:id',
        element: (
          <RequireAuth>
            <Invoice />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'narudzbe', element: <Orders /> },
          { path: 'narudzbe/:id', element: <OrderDetail /> },
          { path: 'proizvodi', element: <Products /> },
          { path: 'proizvodi/novi', element: <ProductEdit /> },
          { path: 'proizvodi/:id', element: <ProductEdit /> },
          { path: 'kategorije', element: <Categories /> },
          { path: 'kupci', element: <Customers /> },
          { path: 'upiti', element: <Inquiries /> },
          { path: 'sadrzaj', element: <ContentEditor /> },
          { path: 'stranice', element: <Pages /> },
          { path: 'stranice/:id', element: <PageEdit /> },
          { path: 'savjeti', element: <Posts /> },
          { path: 'savjeti/:id', element: <PostEdit /> },
          { path: 'projekti', element: <ProjectsAdmin /> },
          { path: 'mediji', element: <Media /> },
          { path: 'kuponi', element: <Coupons /> },
          { path: 'postavke', element: <SettingsPage /> },
        ],
      },
    ],
  },
], { basename: BASENAME });

export default function App() {
  return <RouterProvider router={router} />;
}
