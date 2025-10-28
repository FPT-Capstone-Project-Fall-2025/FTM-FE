// import { useEffect, useRef, useState } from 'react';
// import { X, Edit, Save, Calendar, MapPin, Phone, Mail, User, FileText, Image, Trash2, Plus, Video, File } from 'lucide-react';
// import type { FamilyNode } from '@/types/familytree';
// import familyTreeService from '@/services/familyTreeService';

// interface FileProps {
//   title: string;
//   description: string;
//   fileType: string;
//   file: string | File;
//   thumbnail: string | null;
//   content?: string; // Optional, as seen in the code
// }

// interface MemberDetailPageProps {
//   ftId: string | undefined;
//   memberId: string | undefined;
//   onClose: () => void;
// }

// const MemberDetailPage: React.FC<MemberDetailPageProps> = ({
//   ftId,
//   memberId,
//   onClose
// }) => {
//   const [member, setMember] = useState<FamilyNode | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [activeTab, setActiveTab] = useState<'info' | 'media' | 'story'>('info');
//   const [editedMember, setEditedMember] = useState<FamilyNode | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     const fetchMemberDetail = async () => {
//       if (ftId && memberId) {
//         setLoading(true);
//         setError(null);
//         try {
//           const response = await familyTreeService.getFamilyTreeMemberById(ftId, memberId);
//           setMember(response.data);
//           setEditedMember(response.data);
//         } catch (error) {
//           console.error('Error fetching member details:', error);
//           setError('Không thể tải thông tin thành viên');
//         } finally {
//           setLoading(false);
//         }
//       }
//     }
//     fetchMemberDetail();
//   }, [ftId, memberId]);

//   const handleEdit = () => {
//     setIsEditing(true);
//     setEditedMember(member);
//   };

//   const handleSave = async () => {
//     if (!ftId || !editedMember) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       // Upload new files first
//       const updatedFiles: FileProps[] = await Promise.all(
//         editedMember.ftMemberFiles.map(async (fileItem) => {
//           if (fileItem.file instanceof File) {
//             const response = await familyTreeService.uploadFamilyMemberFile(ftId, editedMember.id, fileItem.file);
//             const uploadedData = response.data; // Assume { file: string (url), thumbnail: string | null, fileType: string }
//             // Revoke local URL if exists
//             if (fileItem.thumbnail && fileItem.thumbnail.startsWith('blob:')) {
//               URL.revokeObjectURL(fileItem.thumbnail);
//             }
//             return {
//               ...fileItem,
//               file: uploadedData.file,
//               thumbnail: uploadedData.thumbnail || null,
//               fileType: uploadedData.fileType,
//             };
//           }
//           return fileItem;
//         })
//       );

//       const updatedMember: FamilyNode = {
//         ...editedMember,
//         ftMemberFiles: updatedFiles,
//       };

//       const response = await familyTreeService.updateFamilyNode(ftId, updatedMember);
//       console.log(response);
      
//       setMember(updatedMember);
//       setIsEditing(false);
      
//       console.log('Member updated successfully');
//     } catch (error) {
//       console.error('Error updating member:', error);
//       setError('Không thể cập nhật thông tin thành viên');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     // Revoke any local URLs for new files
//     if (editedMember) {
//       editedMember.ftMemberFiles.forEach((fileItem) => {
//         if (fileItem.thumbnail && fileItem.thumbnail.startsWith('blob:')) {
//           URL.revokeObjectURL(fileItem.thumbnail);
//         }
//       });
//     }
//     setIsEditing(false);
//     setEditedMember(member);
//     setError(null);
//   };

//   const handleInputChange = (field: keyof FamilyNode, value: any) => {
//     setEditedMember(prev => {
//       if (!prev) return prev;
//       return {
//         ...prev,
//         [field]: value
//       };
//     });
//   };

//   const handleFileAdd = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files?.length || !editedMember) return;

//     const files = Array.from(e.target.files);
//     const newFiles: FileProps[] = files.map((file) => ({
//       title: '',
//       description: '',
//       fileType: file.type,
//       file,
//       thumbnail: file.type.includes('image') ? URL.createObjectURL(file) : null, // For videos, no thumbnail for now
//       content: '', // Optional
//     }));

//     handleInputChange('ftMemberFiles', [...editedMember.ftMemberFiles, ...newFiles]);

//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleFileDelete = (index: number) => {
//     if (!editedMember) return;
//     const fileToDelete = editedMember.ftMemberFiles[index];
//     if (fileToDelete.thumbnail && fileToDelete.thumbnail.startsWith('blob:')) {
//       URL.revokeObjectURL(fileToDelete.thumbnail);
//     }
//     const updatedFiles = editedMember.ftMemberFiles.filter((_, i) => i !== index);
//     handleInputChange('ftMemberFiles', updatedFiles);
//   };

//   const handleFileUpdate = (index: number, field: keyof FileProps, value: string) => {
//     if (!editedMember) return;
//     const updatedFiles = [...editedMember.ftMemberFiles];
//     updatedFiles[index] = {
//       ...updatedFiles[index],
//       [field]: value
//     };
//     handleInputChange('ftMemberFiles', updatedFiles);
//   };

//   const getFileIcon = (fileType: string) => {
//     if (fileType.includes('video')) return <Video className="w-6 h-6" />;
//     if (fileType.includes('image')) return <Image className="w-6 h-6" />;
//     return <File className="w-6 h-6" />;
//   };

//   const getFileSrc = (fileItem: FileProps) => {
//     return fileItem.file instanceof File ? URL.createObjectURL(fileItem.file) : fileItem.file;
//   };

//   // Loading state
//   if (loading && !member) {
//     return (
//       <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl p-8 shadow-2xl">
//           <div className="flex flex-col items-center gap-4">
//             <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//             <p className="text-gray-600">Đang tải thông tin...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error && !member) {
//     return (
//       <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
//           <div className="flex flex-col items-center gap-4">
//             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
//               <X className="w-8 h-8 text-red-500" />
//             </div>
//             <p className="text-gray-800 font-semibold">Lỗi</p>
//             <p className="text-gray-600 text-center">{error}</p>
//             <button
//               onClick={onClose}
//               className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//             >
//               Đóng
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!member || !editedMember) return null;

//   const bgColor = member.gender === 1 ? 'bg-pink-50' : 'bg-blue-50';
//   const accentColor = member.gender === 1 ? 'bg-pink-500' : 'bg-blue-500';
//   const borderColor = member.gender === 1 ? 'border-pink-200' : 'border-blue-200';

//   const currentData = isEditing ? editedMember : member;

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//       <div className={`w-full max-w-5xl h-[90vh] ${bgColor} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
//         {/* Header */}
//         <div className={`${accentColor} text-white p-6 flex justify-between items-center`}>
//           <div className="flex items-center gap-4">
//             <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
//               {currentData.picture ? (
//                 <img src={currentData.picture} alt={currentData.fullname} className="w-full h-full object-cover" />
//               ) : (
//                 <User className="w-10 h-10 text-white" />
//               )}
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold">{currentData.fullname}</h1>
//               <p className="text-white/90">{currentData.ftRole}</p>
//               <p className="text-sm text-white/80">ID: {currentData.id}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             {!isEditing ? (
//               <button
//                 onClick={handleEdit}
//                 className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
//                 disabled={loading}
//               >
//                 <Edit className="w-4 h-4" />
//                 Chỉnh sửa
//               </button>
//             ) : (
//               <>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                       Đang lưu...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-4 h-4" />
//                       Lưu
//                     </>
//                   )}
//                 </button>
//                 <button
//                   onClick={handleCancel}
//                   className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   disabled={loading}
//                 >
//                   Hủy
//                 </button>
//               </>
//             )}
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-white/20 rounded-full transition-colors"
//               disabled={loading}
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex border-b border-gray-300 bg-white">
//           <button
//             onClick={() => setActiveTab('info')}
//             className={`px-6 py-3 font-medium transition-colors ${activeTab === 'info'
//                     ? `${accentColor} text-white`
//                     : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//           >
//             Thông tin cá nhân
//           </button>
//           <button
//             onClick={() => setActiveTab('media')}
//             className={`px-6 py-3 font-medium transition-colors ${activeTab === 'media'
//                     ? `${accentColor} text-white`
//                     : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//           >
//             Hình ảnh & Video
//           </button>
//           <button
//             onClick={() => setActiveTab('story')}
//             className={`px-6 py-3 font-medium transition-colors ${activeTab === 'story'
//                     ? `${accentColor} text-white`
//                     : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//           >
//             Câu chuyện
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6">
//           {/* Error message banner */}
//           {error && (
//             <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
//               <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
//                 <X className="w-5 h-5 text-red-500" />
//               </div>
//               <div className="flex-1">
//                 <p className="text-red-800 font-medium">Lỗi</p>
//                 <p className="text-red-600 text-sm">{error}</p>
//               </div>
//               <button
//                 onClick={() => setError(null)}
//                 className="p-1 hover:bg-red-100 rounded transition-colors"
//               >
//                 <X className="w-5 h-5 text-red-400" />
//               </button>
//             </div>
//           )}

//           {activeTab === 'info' && (
//             <div className="grid grid-cols-2 gap-6">
//               {/* Basic Information */}
//               <div className={`col-span-2 bg-white rounded-lg p-6 border ${borderColor}`}>
//                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                   <User className="w-5 h-5" />
//                   Thông tin cơ bản
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={currentData.fullname}
//                         onChange={(e) => handleInputChange('fullname', e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900">{currentData.fullname}</p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
//                     {isEditing ? (
//                       <select
//                         value={currentData.gender}
//                         onChange={(e) => handleInputChange('gender', Number(e.target.value))}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       >
//                         <option value={0}>Nam</option>
//                         <option value={1}>Nữ</option>
//                       </select>
//                     ) : (
//                       <p className="text-gray-900">{currentData.gender === 0 ? 'Nam' : 'Nữ'}</p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
//                     {isEditing ? (
//                       <input
//                         type="date"
//                         value={currentData.birthday}
//                         onChange={(e) => handleInputChange('birthday', e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900 flex items-center gap-2">
//                         <Calendar className="w-4 h-4" />
//                         {currentData.birthday}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò trong gia đình</label>
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={currentData.ftRole}
//                         onChange={(e) => handleInputChange('ftRole', e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900">{currentData.ftRole}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Contact Information */}
//               <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
//                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                   <Phone className="w-5 h-5" />
//                   Thông tin liên hệ
//                 </h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
//                     {isEditing ? (
//                       <input
//                         type="tel"
//                         value={currentData.phoneNumber}
//                         onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900 flex items-center gap-2">
//                         <Phone className="w-4 h-4" />
//                         {currentData.phoneNumber}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                     {isEditing ? (
//                       <input
//                         type="email"
//                         value={currentData.email}
//                         onChange={(e) => handleInputChange('email', e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900 flex items-center gap-2">
//                         <Mail className="w-4 h-4" />
//                         {currentData.email}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
//                     {isEditing ? (
//                       <textarea
//                         value={currentData.address}
//                         onChange={(e) => handleInputChange('address', e.target.value)}
//                         rows={3}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900 flex items-start gap-2">
//                         <MapPin className="w-4 h-4 mt-1" />
//                         {currentData.address}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Identification */}
//               <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
//                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                   <FileText className="w-5 h-5" />
//                   Giấy tờ tùy thân
//                 </h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Loại giấy tờ</label>
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={currentData.identificationType}
//                         onChange={(e) => handleInputChange('identificationType', e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900">{currentData.identificationType}</p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Số giấy tờ</label>
//                     {isEditing ? (
//                       <input
//                         type="number"
//                         value={currentData.identificationNumber}
//                         onChange={(e) => handleInputChange('identificationNumber', Number(e.target.value))}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     ) : (
//                       <p className="text-gray-900">{currentData.identificationNumber}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Death Information (if applicable) */}
//               {(currentData.isDeath || isEditing) && (
//                 <div className={`col-span-2 bg-gray-100 rounded-lg p-6 border border-gray-300`}>
//                   <h3 className="text-lg font-semibold mb-4 text-gray-800">Thông tin qua đời</h3>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         <input
//                           type="checkbox"
//                           checked={currentData.isDeath}
//                           onChange={(e) => handleInputChange('isDeath', e.target.checked)}
//                           disabled={!isEditing}
//                           className="mr-2"
//                         />
//                         Đã qua đời
//                       </label>
//                     </div>
//                     {currentData.isDeath && (
//                       <>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mất</label>
//                           {isEditing ? (
//                             <input
//                               type="date"
//                               value={currentData.deathDate}
//                               onChange={(e) => handleInputChange('deathDate', e.target.value)}
//                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                           ) : (
//                             <p className="text-gray-900">{currentData.deathDate || '-'}</p>
//                           )}
//                         </div>
//                         <div className="col-span-2">
//                           <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả nguyên nhân</label>
//                           {isEditing ? (
//                             <textarea
//                               value={currentData.deathDescription}
//                               onChange={(e) => handleInputChange('deathDescription', e.target.value)}
//                               rows={2}
//                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                           ) : (
//                             <p className="text-gray-900">{currentData.deathDescription || '-'}</p>
//                           )}
//                         </div>
//                         <div className="col-span-2">
//                           <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ an táng</label>
//                           {isEditing ? (
//                             <textarea
//                               value={currentData.burialAddress}
//                               onChange={(e) => handleInputChange('burialAddress', e.target.value)}
//                               rows={2}
//                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                           ) : (
//                             <p className="text-gray-900">{currentData.burialAddress || '-'}</p>
//                           )}
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'media' && (
//             <div className="space-y-6">
//               <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-lg font-semibold flex items-center gap-2">
//                     <Image className="w-5 h-5" />
//                     Hình ảnh & Video ({currentData.ftMemberFiles?.length || 0})
//                   </h3>
//                   {isEditing && (
//                     <button 
//                       onClick={handleFileAdd}
//                       className={`px-4 py-2 ${accentColor} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
//                     >
//                       <Plus className="w-4 h-4" />
//                       Thêm file
//                     </button>
//                   )}
//                 </div>

//                 <input
//                   type="file"
//                   accept="image/*,video/*"
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                   multiple
//                   className="hidden"
//                 />

//                 {currentData.ftMemberFiles && currentData.ftMemberFiles.length > 0 ? (
//                   <div className="space-y-4">
//                     {currentData.ftMemberFiles.map((file, index) => (
//                       <div key={index} className={`bg-gray-50 rounded-lg p-4 border ${borderColor}`}>
//                         <div className="flex gap-4">
//                           {/* Thumbnail/Preview */}
//                           <div className="flex-shrink-0">
//                             {file.thumbnail ? (
//                               <img 
//                                 src={file.thumbnail} 
//                                 alt={file.title} 
//                                 className="w-32 h-32 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
//                                 onClick={() => setSelectedFileIndex(index)}
//                               />
//                             ) : (
//                               <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
//                                 {getFileIcon(file.fileType)}
//                               </div>
//                             )}
//                           </div>

//                           {/* File Details */}
//                           <div className="flex-1 space-y-3">
//                             {isEditing ? (
//                               <>
//                                 <div>
//                                   <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề</label>
//                                   <input
//                                     type="text"
//                                     value={file.title}
//                                     onChange={(e) => handleFileUpdate(index, 'title', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                     placeholder="Nhập tiêu đề..."
//                                   />
//                                 </div>
//                                 <div>
//                                   <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
//                                   <textarea
//                                     value={file.description}
//                                     onChange={(e) => handleFileUpdate(index, 'description', e.target.value)}
//                                     rows={2}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                     placeholder="Nhập mô tả..."
//                                   />
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                   <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
//                                     {file.fileType}
//                                   </span>
//                                   <button
//                                     onClick={() => handleFileDelete(index)}
//                                     className="ml-auto px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
//                                   >
//                                     <Trash2 className="w-3 h-3" />
//                                     Xóa
//                                   </button>
//                                 </div>
//                               </>
//                             ) : (
//                               <>
//                                 <div>
//                                   <h4 className="font-semibold text-gray-900">{file.title || 'Không có tiêu đề'}</h4>
//                                   <p className="text-sm text-gray-600 mt-1">{file.description || 'Không có mô tả'}</p>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                   <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
//                                     {file.fileType}
//                                   </span>
//                                   {file.content && (
//                                     <span className="text-xs text-gray-400">
//                                       {file.content}
//                                     </span>
//                                   )}
//                                 </div>
//                               </>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 text-gray-500">
//                     <Image className="w-16 h-16 mx-auto mb-4 opacity-30" />
//                     <p>Chưa có hình ảnh hoặc video nào</p>
//                     {isEditing && (
//                       <button 
//                         onClick={handleFileAdd}
//                         className={`mt-4 px-4 py-2 ${accentColor} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto`}
//                       >
//                         <Plus className="w-4 h-4" />
//                         Thêm file đầu tiên
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* File Preview Modal */}
//               {selectedFileIndex !== null && currentData.ftMemberFiles[selectedFileIndex] && (
//                 <div 
//                   className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
//                   onClick={() => setSelectedFileIndex(null)}
//                 >
//                   <div className="relative max-w-4xl max-h-[90vh]">
//                     <button
//                       onClick={() => setSelectedFileIndex(null)}
//                       className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
//                     >
//                       <X className="w-6 h-6 text-white" />
//                     </button>
//                     {currentData.ftMemberFiles[selectedFileIndex].fileType.includes('video') ? (
//                       <video 
//                         src={getFileSrc(currentData.ftMemberFiles[selectedFileIndex])} 
//                         controls 
//                         className="max-w-full max-h-[90vh] rounded-lg"
//                       />
//                     ) : (
//                       <img 
//                         src={getFileSrc(currentData.ftMemberFiles[selectedFileIndex])} 
//                         alt={currentData.ftMemberFiles[selectedFileIndex].title}
//                         className="max-w-full max-h-[90vh] rounded-lg"
//                       />
//                     )}
//                     <div className="mt-4 text-white text-center">
//                       <h3 className="text-lg font-semibold">
//                         {currentData.ftMemberFiles[selectedFileIndex].title}
//                       </h3>
//                       <p className="text-sm text-gray-300 mt-1">
//                         {currentData.ftMemberFiles[selectedFileIndex].description}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'story' && (
//             <div className="space-y-6">
//               <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
//                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                   <FileText className="w-5 h-5" />
//                   Câu chuyện cuộc đời
//                 </h3>
//                 {isEditing ? (
//                   <textarea
//                     value={currentData.storyDescription}
//                     onChange={(e) => handleInputChange('storyDescription', e.target.value)}
//                     rows={10}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="Viết câu chuyện về cuộc đời của thành viên..."
//                   />
//                 ) : (
//                   <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
//                     {currentData.storyDescription || 'Chưa có câu chuyện nào được ghi lại.'}
//                   </p>
//                 )}
//               </div>

//               <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
//                 <h3 className="text-lg font-semibold mb-4">Nội dung bổ sung</h3>
//                 {isEditing ? (
//                   <textarea
//                     value={currentData.content}
//                     onChange={(e) => handleInputChange('content', e.target.value)}
//                     rows={6}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="Thông tin chi tiết khác..."
//                   />
//                 ) : (
//                   <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
//                     {currentData.content || 'Không có nội dung bổ sung.'}
//                   </p>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MemberDetailPage;