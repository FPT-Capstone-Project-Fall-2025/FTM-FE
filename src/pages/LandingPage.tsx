import React from 'react';
import Footer from '../components/shared/Footer';
import bgTexture from '@/assets/img/bg-texture.png';
import exchangeIcon from '@/assets/icons/exchange-icon.svg';
import searchIcon from '@/assets/icons/search-icon.svg';
import networkIcon from '@/assets/icons/network-icon.svg';
import historyIcon from '@/assets/icons/history-icon.svg';
import eventImage from '@/assets/img/event.jpg';

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('landing-animations')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'landing-animations';
    document.head.appendChild(styleElement);
}

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white h-screen" style={{ backgroundImage: `url(${bgTexture})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>

                <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-600 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Year Indicator */}
                <div className="absolute top-8 right-8 text-orange-400 font-bold text-6xl opacity-80 transition-all duration-700 ease-out transform hover:scale-110 hover:opacity-100">
                    <span className="text-orange-300 transition-colors duration-500">{`{`}</span>
                    <span className="mx-2 transition-all duration-500">20</span>
                    <br />
                    <span className="ml-8 transition-all duration-500">26</span>
                    <span className="text-orange-300 transition-colors duration-500">{`}`}</span>
                </div>

                {/* Main Content */}
                <div className="relative z-20 flex items-center justify-center px-8 animate-fade-in h-screen">
                    <div className="text-center max-w-4xl mx-auto backdrop-blur-md bg-white/20 rounded-3xl p-8 border border-gray-200 transition-all duration-700 ease-out transform hover:bg-white/30 hover:border-gray-300 shadow-lg">
                        {/* Welcome Text */}
                        <div className="mb-8">
                            <div className="inline-block px-8 py-3 bg-blue-100 bg-opacity-80 rounded-full text-blue-800 text-lg font-medium backdrop-blur-md border border-blue-200">
                                CHÀO MỪNG BẠN ĐẾN VỚI
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-8">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                                ỨNG DỤNG GIA PHẢ
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
                            Chúng tôi xin chân thành cảm ơn vì bạn đã quan tâm đến ứng dụng Gia Phả của chúng tôi.
                            Đây là một nơi tuyệt vời để bạn khám phá và tìm hiểu về gia phả của mình, nơi tập trung thông tin quan
                            trọng về nguồn gốc gia đình và quan hệ họ hàng.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-500 ease-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg will-change-transform"
                                onClick={() => window.location.href = '/login'}
                            >
                                ĐĂNG KÝ TẠI ĐÂY
                            </button>
                            <button className="px-8 py-4 bg-white hover:bg-gray-100 text-blue-900 font-semibold rounded-lg transition-all duration-500 ease-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg will-change-transform">
                                GỬI BƯU THIẾP
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Benefits Section */}
            <section className="relative pt-40 bg-white overflow-hidden" style={{ backgroundImage: `url(${bgTexture})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                <div className="relative z-10 container mx-auto px-8">
                    {/* Features Container */}
                    <div className="max-w-6xl mx-auto backdrop-blur-md bg-gray-50/50 rounded-3xl p-12 border border-gray-200">
                        {/* Section Title */}
                        <h2 className="text-3xl md:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                            Cung cấp đặc quyền
                        </h2>

                        {/* Section Description */}
                        <p className="text-gray-600 text-center text-lg max-w-4xl mx-auto mb-16 leading-relaxed">
                            Sau khi bạn đã đăng ký thành công, ứng dụng Gia Phả Việt Nam sẽ cung cấp
                            một số tính năng căn thiết đặc biệt dành cho người gia, nhằm giúp bạn khám
                            phá và khai phá về quá trình gia phả của mình. Dưới đây là một số tính năng
                            chúng tôi cung cấp
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Feature 1: Trao đổi gần kết */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img src={exchangeIcon} alt="Exchange Icon" className="w-10 h-10" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Trao đổi gần kết</h3>
                            </div>

                            {/* Feature 2: Truy tìm căn cước */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img src={searchIcon} alt="Search Icon" className="w-10 h-10" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Truy tìm căn cước</h3>
                            </div>

                            {/* Feature 3: Mạng lưới khu vực */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img src={networkIcon} alt="Network Icon" className="w-10 h-10" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Mạng lưới khu vực</h3>
                            </div>

                            {/* Feature 4: Truy cập lịch sử */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img src={historyIcon} alt="History Icon" className="w-10 h-10" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Truy cập lịch sử</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="relative py-40 bg-white overflow-hidden" style={{ backgroundImage: `url(${bgTexture})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                {/* Decorative particles */}
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 mb-6 animate-fade-in">
                            Hội đồng thành viên sáng lập
                        </h2>
                        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            Chúng tôi hy vọng rằng ứng dụng Gia Phả Việt Nam sẽ mang lại cho bạn trải nghiệm thú vị
                            và giúp bạn khám phá sâu hơn về nguồn gốc gia đình của mình.
                        </p>
                    </div>

                    {/* Team Grid */}
                    <div className="flex flex-col gap-8 mb-8">
                        <div className="grid grid-cols-5 gap-6 justify-items-center">
                            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                <div className="mb-6 flex justify-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-300 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <img
                                            src="https://t4.ftcdn.net/jpg/00/98/59/35/360_F_98593539_L3cNIqMZT511Qoz2DXe31xBAqMqPYdGj.jpg"
                                            alt="Danh"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">Nguyen Van Danh</h3>
                                <p className="text-gray-600">Teamlead</p>
                            </div>

                            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                <div className="mb-6 flex justify-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-300 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <img
                                            src="https://t4.ftcdn.net/jpg/00/98/59/35/360_F_98593539_L3cNIqMZT511Qoz2DXe31xBAqMqPYdGj.jpg"
                                            alt="Natalia Brown"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">Nguyen Quang Hau</h3>
                                <p className="text-gray-600">Developer</p>
                            </div>

                            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.5s' }}>
                                <div className="mb-6 flex justify-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-300 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <img
                                            src="https://t4.ftcdn.net/jpg/00/98/59/35/360_F_98593539_L3cNIqMZT511Qoz2DXe31xBAqMqPYdGj.jpg"
                                            alt="Emiley Nova"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">Nguyen Phi Long</h3>
                                <p className="text-gray-600">Developer</p>
                            </div>

                            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.6s' }}>
                                <div className="mb-6 flex justify-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-300 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <img
                                            src="https://t4.ftcdn.net/jpg/00/98/59/35/360_F_98593539_L3cNIqMZT511Qoz2DXe31xBAqMqPYdGj.jpg"
                                            alt="John Krowak"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">Tran Trung Vu</h3>
                                <p className="text-gray-600">Developer</p>
                            </div>

                            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.7s' }}>
                                <div className="mb-6 flex justify-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-300 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <img
                                            src="https://t4.ftcdn.net/jpg/00/98/59/35/360_F_98593539_L3cNIqMZT511Qoz2DXe31xBAqMqPYdGj.jpg"
                                            alt="Brandi Bone"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">Nguyen Hai Truong</h3>
                                <p className="text-gray-600">Developer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Event Schedule Section */}
            <section className="relative py-20 bg-gradient-to-br from-orange-50 to-pink-50 overflow-hidden" style={{ backgroundImage: `url(${bgTexture})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'overlay' }}>
                {/* Decorative Elements */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-orange-300 to-pink-300 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Left Side - Content and Image */}
                        <div className="space-y-8">
                            {/* Section Header */}
                            <div>
                                <h2 className="text-3xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 mb-6 animate-fade-in">
                                    Lịch trình và sự kiện
                                </h2>
                                <p className="text-gray-600 text-lg leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                    Tham gia cùng chúng tôi trong những sự kiện đặc biệt và các buổi thảo luận về gia phả.
                                </p>
                            </div>

                            {/* Decorative Dots Pattern */}
                            <div className="hidden lg:block">
                                <div className="grid grid-cols-8 gap-2 max-w-xs">
                                    {Array.from({ length: 32 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 bg-orange-300 rounded-full opacity-60 animate-pulse"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Event Image */}
                            <div className="relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                <div className="rounded-2xl overflow-hidden shadow-2xl">
                                    <img
                                        src={eventImage}
                                        alt="Conference Event"
                                        className="w-full h-80 object-cover"
                                    />
                                </div>
                                {/* Overlay with people silhouettes */}
                                <div className="absolute bottom-4 left-4 right-4 bg-black/20 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex -space-x-2">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                                            <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                                            <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <span className="text-white text-sm font-medium">50+ tham gia</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Schedule Timeline */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl animate-fade-in" style={{ animationDelay: '0.6s' }}>
                            <div className="space-y-6">
                                {/* Schedule Item 1 */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 mb-1">9AM - 10AM</div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Đón khách & ổn định chỗ ngồi</h3>
                                    </div>
                                </div>

                                {/* Schedule Item 2 */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 mb-1">10AM - 11AM</div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Khai mạc & phần lễ</h3>
                                    </div>
                                </div>

                                {/* Schedule Item 3 */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 mb-1">11AM - 12AM</div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Báo cáo & vinh danh</h3>
                                        <p className="text-gray-600 text-sm">Trình chiếu tư liệu, báo cáo hoạt động, vinh danh cá nhân tiêu biểu.</p>
                                    </div>
                                </div>

                                {/* Schedule Item 4 */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 mb-1">12PM - 01PM</div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Giao lưu – văn nghệ – trò chơi</h3>
                                        <p className="text-gray-600 text-sm">Trình diễn văn nghệ, trò chơi dân gian, giao lưu giữa các thành viên.</p>
                                    </div>
                                </div>

                                {/* Schedule Item 5 */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 mb-1">01PM - 02PM</div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Tiệc họp mặt</h3>
                                        <p className="text-gray-600 text-sm">Ăn uống thân mật, nâng ly chúc mừng, trình chiếu hình ảnh.</p>
                                    </div>
                                </div>

                                {/* Schedule Item 6 */}
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 mb-1">02PM - 03PM</div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Tổng kết & chia tay</h3>
                                        <p className="text-gray-600 text-sm"></p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    Đăng ký tham gia ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
