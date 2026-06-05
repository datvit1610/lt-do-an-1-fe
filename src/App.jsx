import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ChatBot from './components/ChatBot';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DanhSachTaiKhoan from './pages/DanhSachTaiKhoan';
import NhomQuyen from './pages/NhomQuyen';
import HoSo from './pages/HoSo';
import QuanLyThietBi from './pages/QuanLyThietBi';
import QuanLyPhieuMuonTra from './pages/QuanLyPhieuMuonTra';
import CauHinhMuonTra from './pages/CauHinhMuonTra';
import DanhSachTietHoc from './pages/DanhSachTietHoc';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global ChatBot - Available everywhere */}
        <ChatBot />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — dùng MainLayout làm shell */}
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
            <Route path="cau-hinh/muon-tra" element={<CauHinhMuonTra />} />
            <Route path="cau-hinh/tiet-hoc" element={<DanhSachTietHoc />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
