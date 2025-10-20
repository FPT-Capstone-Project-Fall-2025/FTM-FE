import React from 'react';
import Footer from '../components/shared/Footer';
import { Calendar, User, MessageCircle } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  image: string;
  author: string;
  date: string;
  comments: number;
  category?: string;
}

const HomePage: React.FC = () => {
  // Mock articles data based on the image
  const articles: Article[] = [
    {
      id: 1,
      title: "Buổi thi Năng Động - Thông Minh",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "1 Hour Ago",
      comments: 0
    },
    {
      id: 2,
      title: "Tiệc mừng hạnh phúc Long - Uyên",
      image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    },
    {
      id: 3,
      title: "Chào đón căn nhà mới của User.FullName",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    },
    {
      id: 4,
      title: "News Title Lorem Ipsum Dolor Sit Am",
      image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    },
    {
      id: 5,
      title: "Buổi thi Năng Động - Thông Minh",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    },
    {
      id: 6,
      title: "Buổi thi Năng Động - Thông Minh",
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    },
    {
      id: 7,
      title: "Buổi thi Năng Động - Thông Minh",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    },
    {
      id: 8,
      title: "Buổi thi Năng Động - Thông Minh",
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop",
      author: "User.FullName",
      date: "14/12/2025",
      comments: 0
    }
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col bg-gray-50">
        {/* Hero Section */}
        <div 
          className="relative h-96 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=1200&h=400&fit=crop')"
          }}
        >
          <div className="absolute inset-0 flex items-center justify-start px-8 lg:px-16">
            <div className="text-white max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Hội nhóm tập luyện thể thao vào 5-6h sáng hàng ngày
              </h1>
              <div className="flex items-center text-sm space-x-6 mt-6">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>By User.FullName</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>October 4, 2025</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>No comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 container mx-auto px-4 py-12">
          {/* Recent Updates Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Cập nhật gần đây
            </h2>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3" />
                        <span>By {article.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{article.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{article.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
