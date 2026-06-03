import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const FAQ_DATABASE = [
  {
    keywords: ['mật khẩu', 'quên', 'reset', 'đặt lại'],
    question: 'Tôi quên mật khẩu, làm sao để đặt lại?',
    answer: 'Bạn có thể nhấp vào "Quên mật khẩu?" ở trang đăng nhập. Hệ thống sẽ gửi link đặt lại mật khẩu đến email của bạn. Nếu không nhận được email, vui lòng liên hệ quản trị viên.'
  },
  {
    keywords: ['đăng nhập', 'login', 'tài khoản', 'username'],
    question: 'Tên đăng nhập của tôi là gì?',
    answer: 'Tên đăng nhập thường là email cơ quan hoặc mã nhân viên của bạn. Nếu chưa có tài khoản, vui lòng liên hệ bộ phận IT hoặc quản trị viên hệ thống để được cấp tài khoản.'
  },
  {
    keywords: ['mượn', 'mượn thiết bị', 'phiếu mượn'],
    question: 'Làm sao để mượn thiết bị?',
    answer: 'Sau khi đăng nhập, vào mục "Phiếu mượn trả", click "Tạo phiếu mượn", chọn thiết bị cần mượn, chọn ngày dự trả và nhấp "Xác nhận". Quản trị viên sẽ duyệt phiếu của bạn.'
  },
  {
    keywords: ['trả', 'hoàn trả', 'trả lại thiết bị'],
    question: 'Làm sao để trả thiết bị đã mượn?',
    answer: 'Vào "Phiếu mượn trả", tìm phiếu mượn của bạn với trạng thái "Đang mượn", click "Trả", chọn ngày trả thực tế và nhấp "Xác nhận". Quản trị viên sẽ xác nhận việc trả.'
  },
  {
    keywords: ['quá hạn', 'hạn', 'trễ', 'muộn'],
    question: 'Thiết bị của tôi bị quá hạn, tôi phải làm gì?',
    answer: 'Nếu thiết bị quá hạn, vui lòng trả lại ngay lập tức. Bạn có thể xem ngày quá hạn ở Dashboard hoặc trong mục "Phiếu mượn trả". Liên hệ quản trị viên nếu gặp khó khăn.'
  },
  {
    keywords: ['báo cáo', 'thống kê', 'dashboard', 'tổng quan'],
    question: 'Tôi có thể xem báo cáo thiết bị ở đâu?',
    answer: 'Sau khi đăng nhập, trang "Dashboard" sẽ hiển thị tổng quan hệ thống với các thống kê về: số thiết bị, trạng thái, phiếu mượn trả, và hoạt động gần đây.'
  },
  {
    keywords: ['tìm', 'tìm kiếm', 'search', 'lọc', 'filter'],
    question: 'Làm sao để tìm một thiết bị cụ thể?',
    answer: 'Vào "Quản lý thiết bị", sử dụng thanh tìm kiếm ở trên cùng để tìm theo: Mã thiết bị, Tên, Loại, hoặc Trạng thái. Bạn cũng có thể dùng bộ lọc để lọc theo tiêu chí.'
  },
  {
    keywords: ['quyền', 'permission', 'role', 'vai trò'],
    question: 'Tôi không có quyền truy cập một chức năng, sao?',
    answer: 'Quyền truy cập phụ thuộc vào vai trò của tài khoản bạn. Hãy liên hệ quản trị viên để yêu cầu cấp thêm quyền hoặc nâng cấp vai trò tài khoản.'
  },
  {
    keywords: ['lỗi', 'bug', 'không hoạt động', 'error', 'problem'],
    question: 'Tôi gặp lỗi kỹ thuật, làm sao?',
    answer: 'Vui lòng liên hệ bộ phận IT hoặc quản trị viên hệ thống. Cung cấp thông tin: tên tài khoản, thao tác bạn đang làm khi gặp lỗi, và screenshot nếu có.'
  },
  {
    keywords: ['nhập', 'import', 'excel', 'batch'],
    question: 'Tôi có thể nhập danh sách thiết bị từ Excel được không?',
    answer: 'Có, ở mục "Quản lý thiết bị", có nút "Nhập Excel". Tải file Excel theo định dạng có sẵn, chọn file và nhấp "Nhập". Hệ thống sẽ xử lý và thêm thiết bị.'
  },
  {
    keywords: ['xuất', 'export', 'tải', 'download', 'csv'],
    question: 'Tôi có thể xuất dữ liệu ra Excel không?',
    answer: 'Có, hầu hết các trang đều có nút "Xuất Excel" hoặc "Tải file". Nhấp nút này để tải danh sách dưới dạng Excel hoặc CSV.'
  },
  {
    keywords: ['liên hệ', 'hỗ trợ', 'support', 'giúp đỡ', 'assistance'],
    question: 'Tôi cần liên hệ với quản trị viên',
    answer: 'Để liên hệ quản trị viên: Email: admin@hust.edu.vn | Điện thoại: 024-XXXX-XXXX | Văn phòng IT tầng 2, Nhà T1'
  }
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Xin chào! 👋 Tôi là trợ lý ảo của HUST EMS. Bạn cần hỏi gì về hệ thống quản lý thiết bị?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findAnswer = (text) => {
    const normalized = text.toLowerCase();
    for (const faq of FAQ_DATABASE) {
      if (faq.keywords.some(keyword => normalized.includes(keyword))) {
        return faq;
      }
    }
    return null;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg = { type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);

    // Find and send answer
    const faq = findAnswer(input);
    if (faq) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { type: 'bot', text: faq.answer, suggestion: faq.question }
        ]);
      }, 500);
    } else {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            text: 'Tôi chưa hiểu câu hỏi của bạn 😕. Vui lòng thử hỏi lại hoặc liên hệ quản trị viên để được hỗ trợ trực tiếp.'
          }
        ]);
      }, 500);
    }

    setInput('');
  };

  const handleQuickQuestion = (faq) => {
    setMessages(prev => [...prev, { type: 'user', text: faq.question }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: faq.answer }]);
    }, 500);
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>HUST EMS - Trợ lý ảo</h3>
            <button onClick={() => setIsOpen(false)} className="chatbot-close">×</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.type}`}>
                <div className="message-content">{msg.text}</div>
                {msg.suggestion && (
                  <div className="message-suggestion">
                    {msg.suggestion}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="chatbot-suggestions">
              <p>Câu hỏi phổ biến:</p>
              <div className="suggestions-grid">
                {FAQ_DATABASE.slice(0, 4).map((faq, idx) => (
                  <button
                    key={idx}
                    className="suggestion-btn"
                    onClick={() => handleQuickQuestion(faq)}
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form className="chatbot-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="send-btn">Gửi</button>
          </form>
        </div>
      )}
    </>
  );
}
