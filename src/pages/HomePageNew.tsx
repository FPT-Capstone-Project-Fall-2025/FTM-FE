import { useState, useEffect } from 'react';
import {
    Users,
    TreePine,
    Wallet,
    Calendar,
    UserPlus,
    TrendingUp,
    Shield,
    MousePointerClick,
    ArrowRight,
    ChevronRight,
    Sparkles,
    Heart,
    HandCoins,
    ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const [scrollY, setScrollY] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 5);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: <Users className="w-8 h-8" />,
            title: "Quản lý Tài Khoản",
            description: "Quản lý thông tin các thành viên trong gia tộc một cách dễ dàng và an toàn. Thay thế cách truyền thống ghi chép trên sổ sách, giờ đây mọi thứ đều số hóa.",
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-50"
        },
        {
            icon: <TreePine className="w-8 h-8" />,
            title: "Cây Gia Phả Trực Quan",
            description: "Tạo và xem cây gia phả dưới dạng biểu đồ trực quan. Mời thành viên tham gia, kéo thả để sắp xếp - mọi thứ chỉ bằng vài cú click chuột.",
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-50"
        },
        {
            icon: <Wallet className="w-8 h-8" />,
            title: "Quỹ Gia Tộc",
            description: "Quản lý quỹ chung để mọi thành viên cùng đóng góp. Minh bạch trong từng giao dịch, dễ dàng theo dõi thu chi.",
            color: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-50"
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: "Chiến Dịch Gây Quỹ",
            description: "Tạo các chiến dịch gây quỹ cho những dịp đặc biệt. Mọi giao dịch đều được ghi nhận minh bạch và công khai.",
            color: "from-orange-500 to-red-500",
            bgColor: "bg-orange-50"
        },
        {
            icon: <Calendar className="w-8 h-8" />,
            title: "Quản lý Sự Kiện",
            description: "Tạo và quản lý các sự kiện quan trọng. Tự động nhắc nhở thành viên tham gia vào những dịp đặc biệt trong gia tộc.",
            color: "from-indigo-500 to-blue-500",
            bgColor: "bg-indigo-50"
        }
    ];

    const stats = [
        { number: "100%", label: "Số Hóa", icon: <Sparkles className="w-5 h-5" /> },
        { number: "Dễ Dàng", label: "Sử Dụng", icon: <MousePointerClick className="w-5 h-5" /> },
        { number: "Minh Bạch", label: "Giao Dịch", icon: <Shield className="w-5 h-5" /> },
        { number: "Kết Nối", label: "Gia Đình", icon: <Heart className="w-5 h-5" /> }
    ];

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    };

    const navigateToFamilyTrees = () => {
        navigate('/family-trees');
    };

    return (
        <div className="h-full w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-y-auto">
            {/* Hero Section */}
            <div className="relative h-full flex items-center justify-center overflow-hidden">
                {/* Family Photos Background */}
                <div className="absolute inset-0 z-9 overflow-hidden">
                    {/* Animated family photos */}
                    <div className="absolute inset-0 grid grid-cols-4 gap-4 p-4 opacity-50">
                        {[
                            'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
                            'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400',
                            'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
                            'https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?w=400',
                            'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=400',
                            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
                            'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
                            'https://images.unsplash.com/photo-1657664058220-a1bfc04e2e14?w=400',
                            'https://images.unsplash.com/photo-1593134257782-e89567b7718a?w=400',
                            'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400',
                            'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400',
                            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
                        ].map((url, index) => (
                            <div
                                key={index}
                                className="rounded-2xl overflow-hidden animate-float"
                                style={{
                                    animationDelay: `${index * 0.3}s`,
                                    animationDuration: `${4 + (index % 3)}s`
                                }}
                            >
                                <img
                                    src={url}
                                    alt="Family"
                                    className="w-full h-62 object-cover hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Animated gradient blobs */}
                    <div className="absolute inset-0 z-20">
                        <div
                            className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
                            style={{ animationDelay: '0s' }}
                        />
                        <div
                            className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
                            style={{ animationDelay: '2s' }}
                        />
                        <div
                            className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
                            style={{ animationDelay: '4s' }}
                        />
                    </div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
                    {/* Floating Icon */}
                    <div
                        className="inline-flex mb-8 animate-float"
                        style={{ transform: `translateY(${Math.sin(scrollY * 0.01) * 10}px)` }}
                    >
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl backdrop-blur-sm">
                            <TreePine className="w-16 h-16 text-white" />
                        </div>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                        Gia Phả Số
                    </h1>
                    <p className="text-2xl md:text-3xl text-gray-700 mb-6 font-medium">
                        Quản Lý Gia Tộc Hiện Đại
                    </p>
                    <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Thay thế cách truyền thống ghi chép trên sổ sách.
                        Quản lý thông tin gia đình, quỹ chung và sự kiện một cách
                        <span className="font-semibold text-blue-600"> dễ dàng</span>,
                        <span className="font-semibold text-purple-600"> minh bạch</span> và
                        <span className="font-semibold text-pink-600"> hiện đại</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={navigateToFamilyTrees}
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        >
                            Bắt Đầu Ngay
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={scrollToFeatures}
                            className="px-8 py-4 bg-white text-gray-700 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        >
                            Tìm Hiểu Thêm
                            <ChevronDown className="w-5 h-5 animate-bounce" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                <div className="flex justify-center mb-3 text-blue-600">
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <ChevronDown className="w-8 h-8 text-gray-400" />
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Tính Năng Nổi Bật
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Mọi công cụ bạn cần để quản lý gia tộc một cách hiện đại và hiệu quả
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden ${activeFeature === index ? 'ring-2 ring-blue-500 scale-105' : ''
                                    }`}
                                onMouseEnter={() => setActiveFeature(index)}
                            >
                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className="relative z-10">
                                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        <div className="text-white">
                                            {feature.icon}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                                        {feature.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed mb-4">
                                        {feature.description}
                                    </p>

                                    <div className="flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-sm">Khám phá</span>
                                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {/* Corner Decoration */}
                                <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-10 -translate-y-10">
                                    <div className={`w-full h-full bg-gradient-to-br ${feature.color} opacity-10 rounded-full`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="py-20 px-6 bg-gradient-to-br from-blue-100/50 to-purple-100/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Cách Thức Hoạt Động
                        </h2>
                        <p className="text-xl text-gray-600">
                            Chỉ với 3 bước đơn giản
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                icon: <UserPlus className="w-10 h-10" />,
                                title: "Tạo Gia Phả",
                                description: "Bắt đầu bằng việc tạo cây gia phả và thêm thông tin các thành viên"
                            },
                            {
                                step: "02",
                                icon: <MousePointerClick className="w-10 h-10" />,
                                title: "Kéo Thả Dễ Dàng",
                                description: "Sắp xếp cây gia phả bằng cách kéo thả, mời thành viên chỉ bằng một cú click"
                            },
                            {
                                step: "03",
                                icon: <HandCoins className="w-10 h-10" />,
                                title: "Quản Lý & Chia Sẻ",
                                description: "Quản lý quỹ, tổ chức sự kiện và kết nối mọi thành viên trong gia tộc"
                            }
                        ].map((step, index) => (
                            <div
                                key={index}
                                className="relative group"
                            >
                                {/* Connection Line */}
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transform -translate-y-1/2 -translate-x-1/2 z-0" />
                                )}

                                <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 z-10">
                                    <div className="text-6xl font-bold text-blue-100 mb-4">{step.step}</div>

                                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                                        {step.icon}
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        {step.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12 relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Sẵn Sàng Bắt Đầu?
                            </h2>
                            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                                Hãy cùng số hóa gia phả và kết nối gia tộc của bạn một cách hiện đại nhất
                            </p>
                            <button
                                onClick={navigateToFamilyTrees}
                                className="group px-10 py-5 bg-white text-purple-600 rounded-full font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
                            >
                                Khởi Tạo Gia Phả Ngay
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default HomePage;