# Honor Board Feature Documentation

## Overview
The Honor Board feature allows family members to showcase and celebrate academic and career achievements within the genealogy system. This feature provides a leaderboard-style interface for viewing, adding, editing, and deleting honor records.

## Features

### 1. Two Honor Boards
- **Academic Honor Board**: For educational achievements (degrees, academic awards, scholarships, etc.)
- **Career Honor Board**: For professional accomplishments (promotions, awards, achievements, etc.)

### 2. CRUD Operations
- ✅ **Create**: Add new honors with photos, descriptions, and details
- ✅ **Read**: View all honors in a leaderboard-style interface
- ✅ **Update**: Edit existing honor entries
- ✅ **Delete**: Remove honor records

### 3. Leaderboard-Style UI
- **Rankings**: Top 3 positions highlighted with gold/silver/bronze medals
- **Member Photos**: Display member profile pictures
- **Achievement Details**: Organization, position, year, description
- **Certificate Photos**: Upload and display achievement certificates
- **Statistics**: Total honors, public displays, recent year

## File Structure

```
src/
├── services/
│   └── honorBoardService.ts          # API service for honor operations
├── pages/
│   └── FamilytreeList/
│       ├── FamilyTreePage.tsx         # Main page with tabs (updated)
│       └── components/
│           └── HonorBoard.tsx         # Honor board component
└── docs/
    └── HONOR_BOARD_FEATURE.md         # This file
```

## API Integration

### Base URLs
- Academic: `/api/academichonor`
- Career: `/api/careerhonor`

### Endpoints

#### 1. Get All Honors
```
GET /api/{academichonor|careerhonor}?familyTreeId={id}&pageIndex={num}&pageSize={num}
```

**Response:**
```json
{
  "data": {
    "pageIndex": 1,
    "pageSize": 100,
    "totalPages": 1,
    "totalItems": 5,
    "data": [
      {
        "id": "uuid",
        "gpMemberId": "uuid",
        "memberFullName": "Nguyen Van A",
        "memberPhotoUrl": "url",
        "familyTreeId": "uuid",
        "achievementTitle": "Thủ khoa đại học",
        "organizationName": "Đại học Bách Khoa",
        "position": "Sinh viên",
        "yearOfAchievement": 2020,
        "description": "Tốt nghiệp loại xuất sắc",
        "photoUrl": "certificate-url",
        "isDisplayed": true,
        "createdOn": "2025-01-01T00:00:00Z",
        "lastModifiedOn": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 2. Get Honor by ID
```
GET /api/{academichonor|careerhonor}/{honorId}
```

#### 3. Create Honor
```
POST /api/{academichonor|careerhonor}
Content-Type: multipart/form-data

Fields:
- AchievementTitle: string (required)
- OrganizationName: string (required)
- FamilyTreeId: string (required)
- GPMemberId: string (required)
- YearOfAchievement: number (required)
- IsDisplayed: boolean (required)
- Position: string (optional)
- Description: string (optional)
- Photo: File (optional)
```

#### 4. Update Honor
```
PUT /api/{academichonor|careerhonor}/{honorId}
Content-Type: multipart/form-data

Fields: (all optional)
- AchievementTitle: string
- OrganizationName: string
- Position: string
- YearOfAchievement: number
- Description: string
- IsDisplayed: boolean
- Photo: File
```

#### 5. Delete Honor
```
DELETE /api/{academichonor|careerhonor}/{honorId}
```

## Component Structure

### HonorBoard.tsx

#### State Management
```typescript
const [activeBoard, setActiveBoard] = useState<'academic' | 'career'>('academic');
const [academicHonors, setAcademicHonors] = useState<HonorData[]>([]);
const [careerHonors, setCareerHonors] = useState<HonorData[]>([]);
const [showModal, setShowModal] = useState(false);
const [editingHonor, setEditingHonor] = useState<HonorData | null>(null);
```

#### Key Functions
- `fetchHonors()`: Load honors from API
- `handleOpenModal(honor?)`: Open add/edit modal
- `handleSubmit()`: Create or update honor
- `handleDelete(honorId)`: Delete honor record
- `handlePhotoChange()`: Handle certificate photo upload

#### UI Sections
1. **Header**: Title and "Add Honor" button
2. **Board Tabs**: Switch between Academic and Career
3. **Statistics Cards**: Total, displayed, recent year
4. **Leaderboard**: Ranked list with medals for top 3
5. **Add/Edit Modal**: Form for creating/editing honors with searchable member selector

### Service Layer (honorBoardService.ts)

#### Academic Honor Methods
- `getAcademicHonors(familyTreeId, pageIndex, pageSize)`
- `getAcademicHonorById(honorId)`
- `createAcademicHonor(data)`
- `updateAcademicHonor(honorId, data)`
- `deleteAcademicHonor(honorId)`

#### Career Honor Methods
- `getCareerHonors(familyTreeId, pageIndex, pageSize)`
- `getCareerHonorById(honorId)`
- `createCareerHonor(data)`
- `updateCareerHonor(honorId, data)`
- `deleteCareerHonor(honorId)`

## UI/UX Features

### Ranking System
- **1st Place**: Gold medal (yellow gradient)
- **2nd Place**: Silver medal (gray gradient)
- **3rd Place**: Bronze medal (orange gradient)
- **4th+**: Gray circle with number

### Visual Elements
- Member profile photos
- Achievement certificates
- Organization logos
- Year badges
- Description text

### Responsive Design
- Mobile-friendly layout
- Adaptive grid for statistics
- Scrollable modal for long forms
- Image preview for uploads

## Data Validation

### Required Fields
- ✅ Member (searchable dropdown from family tree members)
- ✅ Achievement Title
- ✅ Organization Name
- ✅ Year of Achievement
- ✅ Family Tree ID

### Optional Fields
- Position (for career)
- Description
- Certificate Photo
- Display Status

### Member Selection
- **Searchable dropdown**: Type to filter by member name
- **Auto-loaded**: Members fetched from family tree automatically
- **Real-time search**: Filter results as you type
- **Validation**: Only existing family members can be selected

### Constraints
- Year: 1900 to current year + 10
- Photo: Image files only
- Maximum file size: Set by API
- Member: Must exist in current family tree

## Integration with Family Tree Page

The Honor Board is integrated as a new tab in the Family Tree Page:

```typescript
const tabs = [
  { id: 'basic', label: 'THÔNG TIN CƠ BẢN' },
  { id: 'tree', label: 'GIA PHẢ' },
  { id: 'members', label: 'THÀNH VIÊN' },
  { id: 'honor-board', label: 'BẢNG VINH DANH' } // NEW
];
```

### Tab State Management
- URL parameters: `?tab=honor-board`
- Local storage: Persists selected tab
- Type-safe navigation

## Usage Examples

### Viewing Honors
1. Navigate to Family Tree page
2. Click "BẢNG VINH DANH" tab
3. Toggle between Academic/Career boards
4. View ranked list of achievements

### Adding an Honor
1. Click "Thêm danh hiệu" button
2. Fill in required fields:
   - Member (searchable dropdown with all family tree members)
   - Achievement title
   - Organization name
   - Year
3. Optional: Add position, description, photo
4. Click "Thêm mới"

### Editing an Honor
1. Click edit icon (✏️) on any honor card
2. Modify fields as needed
3. Click "Cập nhật"

### Deleting an Honor
1. Click delete icon (🗑️) on any honor card
2. Confirm deletion in popup
3. Honor is removed from list

## Error Handling

### API Errors
- Network failures: Toast notification
- Validation errors: Form field highlights
- Authorization: Redirect to login

### User Input
- Empty required fields: Validation messages
- Invalid year: Input constraints
- Large files: Size warnings

## Future Enhancements

### Completed Features
- [x] Member search/autocomplete (with Ant Design Select)

### Planned Features
- [ ] Export to PDF
- [ ] Social sharing
- [ ] Achievement categories
- [ ] Timeline view
- [ ] Bulk import/export
- [ ] Photo gallery
- [ ] Comments/reactions
- [ ] Notification system

### API Improvements
- [ ] Pagination optimization
- [ ] Search/filter endpoints
- [ ] Batch operations
- [ ] Photo compression
- [ ] Analytics/statistics

## Testing Checklist

### Functional Tests
- [x] Load honors from API
- [x] Create new honor
- [x] Update existing honor
- [x] Delete honor
- [x] Switch between boards
- [x] Upload photos
- [x] Form validation

### UI Tests
- [x] Responsive layout
- [x] Modal interactions
- [x] Tab navigation
- [x] Loading states
- [x] Error messages
- [x] Empty states

### Integration Tests
- [x] Family tree selection
- [x] Member data integration
- [x] Photo upload/display
- [x] Persistence across sessions

## Performance Considerations

### Optimizations
- Lazy loading of images
- Pagination for large datasets
- Debounced search inputs
- Cached API responses
- Optimistic UI updates

### Bundle Size
- Code splitting by tab
- Dynamic imports for modals
- Compressed images
- Minified production build

## Accessibility

### Features
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support
- Color contrast compliance

### Best Practices
- Semantic HTML
- Alt text for images
- Form label associations
- Error announcements
- Skip links

## Security

### Considerations
- File type validation
- File size limits
- Input sanitization
- Authorization checks
- CSRF protection

### API Security
- JWT authentication
- Role-based access
- Rate limiting
- Input validation
- SQL injection prevention

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile Support
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Android WebView

## Troubleshooting

### Common Issues

**Issue**: Honors not loading
- **Solution**: Check family tree ID, verify API connection

**Issue**: Photo upload fails
- **Solution**: Check file size/type, verify FormData format

**Issue**: Tab state not persisting
- **Solution**: Check localStorage permissions, clear cache

**Issue**: Ranking order incorrect
- **Solution**: Verify year sorting, check API response

## Contributing

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Format with Prettier
- Write meaningful commit messages

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description
5. Address review comments

## License
This feature is part of the Family Tree Management System.

## Contact
For questions or support, contact the development team.

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
**Author**: Development Team

