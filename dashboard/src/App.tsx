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

export default function App() {
  return (
    <Routes>
      {/* Homepage - standalone layout */}
      <Route path="/" element={<Home />} />
      
      {/* Dashboard - with sidebar layout */}
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="templates" element={<Templates />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="sequences" element={<Sequences />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="strategy" element={<Strategy />} />
        <Route path="logs" element={<Logs />} />
      </Route>
    </Routes>
  );
}
