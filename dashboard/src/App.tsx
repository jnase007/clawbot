import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ClientDashboard from './pages/ClientDashboard';
import Contacts from './pages/Contacts';
import Templates from './pages/Templates';
import Logs from './pages/Logs';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import Strategy from './pages/Strategy';
import Sequences from './pages/Sequences';
import Inbox from './pages/Inbox';
import ApolloLeads from './pages/ApolloLeads';
import ContentStudio from './pages/ContentStudio';
import ClientWorkflow from './pages/ClientWorkflow';
import Setup from './pages/Setup';
import Discovery from './pages/Discovery';
import ImageAds from './pages/ImageAds';

export default function App() {
  return (
    <Routes>
      {/* Homepage - standalone layout */}
      <Route path="/" element={<Home />} />
      
      {/* Dashboard - with sidebar layout */}
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="clients" element={<ClientWorkflow />} />
        <Route path="discovery" element={<Discovery />} />
        <Route path="apollo" element={<ApolloLeads />} />
        <Route path="content" element={<ContentStudio />} />
        <Route path="image-ads" element={<ImageAds />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="templates" element={<Templates />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="sequences" element={<Sequences />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="strategy" element={<Strategy />} />
        <Route path="logs" element={<Logs />} />
        <Route path="setup" element={<Setup />} />
      </Route>
    </Routes>
  );
}
