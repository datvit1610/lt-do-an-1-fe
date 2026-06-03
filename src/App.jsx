import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ChatBot from './components/ChatBot';
import DashboardPage from './pages/DashboardPage';
import DanhSachTaiKhoan from './pages/DanhSachTaiKhoan';
import NhomQuyen from './pages/NhomQuyen';
import HoSo from './pages/HoSo';
import QuanLyThietBi from './pages/QuanLyThietBi';
import QuanLyPhieuMuonTra from './pages/QuanLyPhieuMuonTra';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global ChatBot - Available everywhere */}
        <ChatBot />

        <Routes>
          {/* Redirect login and unknown routes straight into the app */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="thiet-bi" element={<QuanLyThietBi />} />
            <Route path="phieu-muon-tra" element={<QuanLyPhieuMuonTra />} />
            <Route path="tai-khoan/danh-sach" element={<DanhSachTaiKhoan />} />
            <Route path="tai-khoan/nhom-quyen" element={<NhomQuyen />} />
            <Route path="tai-khoan/ho-so" element={<HoSo />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
