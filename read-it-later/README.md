# Read It Later

A simple, clean web application for saving articles and URLs for later reading. Built with vanilla HTML, CSS, and JavaScript following the KISS (Keep It Simple, Stupid) principle.

## ✨ Latest Updates (December 2024)

### ✏️ Edit Article Functionality (New!)
- Added "Edit" button to each article item for easy modification
- Modal dialog allows editing of article title and tags
- Pre-populated form fields with current article data
- Full keyboard support (Enter to save, Escape to cancel)
- Proper validation and error handling
- Seamless integration with existing localStorage data

### 🎨 Refined Color Palette (Updated!)
- Softened the aggressive coral red to a more muted, comfortable tone (#C44569)
- Improved visual comfort while maintaining Pocket's brand identity
- Enhanced accessibility with better contrast ratios
- More professional and easier-on-the-eyes color scheme
- Consistent theming across all UI elements

### 🐛 UI Bug Fixes & Improvements
- Fixed label-input associations in edit modal for better accessibility
- Improved article action button spacing and mobile responsiveness
- Updated all hardcoded colors to use CSS custom properties
- Enhanced mobile button sizing for better touch interaction
- Consistent color usage throughout the application

### 🗑️ Delete All Functionality
- Added "Delete All Articles" button with smart visibility (only shows when articles exist)
- Confirmation dialog shows exact number of articles to be deleted
- Full keyboard support (Enter to confirm, Escape to cancel)
- Success message with undo functionality

### 🎯 Tab-Style Filter Interface
- Redesigned filter buttons as modern browser-style tabs
- Moved search bar above tabs for better visual hierarchy
- Improved mobile experience with horizontal scrolling tabs
- Enhanced accessibility with proper ARIA tab attributes

## Features

- **Save Articles**: Add articles by URL with optional custom titles and tags
- **Edit Articles**: Modify article titles and tags with an intuitive edit modal
- **Automatic Title Extraction**: Automatically fetch article titles from URLs when possible
- **Tag Management**: Organize articles with tags and search by tag names
- **Read/Unread Status**: Mark articles as read or unread with visual indicators
- **Advanced Search & Filter**: Search through articles by title, URL, or tags with intuitive filter tabs
- **Delete Articles**: Remove individual articles or delete all articles with confirmation prompts
- **Import/Export**: Import from and export to Pocket CSV format for data portability
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Persistent Storage**: Articles are saved locally in your browser
- **Accessibility**: Full keyboard navigation and screen reader support

## Quick Start

1. Open `index.html` in your web browser
2. Start adding articles by entering URLs in the form
3. Manage your reading list with the provided controls

## Testing

The application includes a comprehensive test suite to verify all functionality:

1. Open `test.html` in your web browser (works locally and on GitHub Pages)
2. Click "🚀 Run All Tests" to execute all tests automatically
3. Or run individual tests by clicking the test buttons in each section

**Test Coverage:**
- ✅ App availability and method validation
- ✅ Tag processing and validation
- ✅ Edit functionality and modal behavior
- ✅ Title extraction with multiple fallback strategies
- ✅ Filter logic (All/Unread/Archived)
- ✅ CSV parsing with complex data handling
- ✅ Article creation from CSV data

**GitHub Pages Compatibility:**
- ✅ Tests work both locally and when deployed to GitHub Pages
- ✅ Handles CORS restrictions gracefully in title extraction tests
- ✅ Creates mock DOM elements when needed for standalone testing
- ✅ Provides clear feedback about test environment and limitations

The test suite provides detailed feedback and validates that all features work correctly across different scenarios and deployment environments.

## Usage

### Adding Articles

1. Enter a URL in the "Article URL" field
2. **Automatic Title**: When you move to the next field, the app will try to fetch the article title automatically
3. Optionally provide a custom title (overrides the auto-fetched title)
4. Add tags separated by commas (e.g., "javascript, tutorial, web development")
5. Click "Save Article" to add it to your list

**URL Format**: The application accepts URLs with or without the `https://` protocol. If no protocol is provided, `https://` will be automatically added.

**Title Extraction**: The app uses multiple strategies to automatically fetch article titles:
1. **CORS Proxy Services**: Attempts to use free proxy services to bypass CORS restrictions
2. **Direct Fetch**: Tries direct access (works for sites that allow CORS)
3. **Smart URL Analysis**: Generates intelligent titles from URL structure for sites like Wikipedia, GitHub, Stack Overflow, etc.

**Note**: Due to browser security (CORS), many websites block automatic title fetching. The app handles this gracefully by using alternative methods or generating titles from the URL structure.

### Managing Articles

- **Edit Articles**: Click the "Edit" button to modify article title and tags in a modal dialog
- **Mark as Read/Unread**: Click the "Mark Read" or "Mark Unread" button on any article
- **Delete Articles**: Click the "Delete" button and confirm the action, or use "Delete All" to remove all articles
- **Search**: Use the search box to find articles by title, URL, or tag names
- **Filter**: Use the filter tabs to show all articles, only unread, or only archived articles
- **Tag Navigation**: Click on any tag to search for articles with that tag

### Import/Export

#### Importing from Pocket

1. Export your data from Pocket (getpocket.com) in CSV format
2. Click the "Import CSV" button in the application
3. Select your Pocket CSV file
4. Review the import summary showing imported, skipped, and error counts

**Supported Format**: The application supports the standard Pocket CSV export format with columns: `title`, `url`, `time_added`, `tags`, `status`

**Duplicate Handling**: Articles with duplicate URLs will be automatically skipped during import

#### Exporting Your Data

1. Click the "Export CSV" button
2. Your articles will be downloaded as a CSV file compatible with Pocket
3. The exported file includes all article data: titles, URLs, timestamps, tags, and read status

**File Format**: Exported files use the same CSV format as Pocket exports, ensuring compatibility for re-importing or transferring to other applications

### Keyboard Shortcuts

- **Ctrl/Cmd + F**: Focus the search input
- **Ctrl/Cmd + N**: Focus the URL input for adding new articles
- **Escape**: Close any open notification messages

## Technical Details

### Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Required Features**: localStorage, ES6 features (arrow functions, const/let, template literals)

### Storage

Articles are stored locally in your browser using `localStorage`. This means:
- Articles persist between browser sessions
- Data is stored locally on your device only
- No data is sent to external servers
- Clearing browser data will remove saved articles

### File Structure

```
read-it-later/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── script.js           # Application logic and functionality
├── README.md           # This documentation
└── IMPLEMENTATION_SUMMARY.md  # Technical implementation details
```

## Accessibility Features

- **Semantic HTML**: Proper heading hierarchy and landmark elements
- **ARIA Labels**: Screen reader friendly labels and descriptions
- **Keyboard Navigation**: Full functionality available via keyboard
- **Focus Management**: Clear focus indicators and logical tab order
- **Screen Reader Support**: Live regions for dynamic content updates
- **Color Contrast**: WCAG AA compliant color combinations

## Development

### Code Organization

The application follows a modular structure:

- **HTML**: Semantic structure with proper accessibility attributes
- **CSS**: Mobile-first responsive design with clean, modern styling
- **JavaScript**: Object-oriented approach with clear separation of concerns

### Key Components

1. **App Object**: Main application controller
2. **Article Management**: CRUD operations for articles
3. **UI Rendering**: Dynamic content generation and updates
4. **Event Handling**: User interaction management
5. **Data Persistence**: localStorage integration
6. **Error Handling**: Comprehensive validation and user feedback

### Adding Features

To extend the application:

1. Add new methods to the `App` object
2. Update the HTML structure if needed
3. Add corresponding CSS styles
4. Update this documentation

## Browser Support Notes

### localStorage

The application requires localStorage support. If localStorage is not available:
- A warning message will be displayed
- Articles will not persist between sessions
- All other functionality remains available

### Modern JavaScript Features

The code uses ES6+ features including:
- Arrow functions
- Template literals
- const/let declarations
- Destructuring assignment

For older browser support, consider transpiling with Babel.

## Troubleshooting

### Common Issues

**Articles not saving**: 
- Check if localStorage is enabled in your browser
- Ensure you haven't exceeded the storage quota (usually 5-10MB)

**URL validation errors**:
- Ensure URLs include a valid domain name
- Only HTTP and HTTPS protocols are supported

**Search not working**:
- Search is case-insensitive and matches both titles and URLs
- Clear the search field to see all articles

**Title extraction not working**:
- This is normal behavior due to CORS (Cross-Origin Resource Sharing) restrictions
- Most websites block automatic title fetching for security reasons
- The app will automatically generate a title from the URL structure
- You can always manually enter a custom title

### Storage Limits

localStorage has size limits (typically 5-10MB per domain). If you reach this limit:
- Delete older articles you no longer need
- The application will show a warning when storage is full

## Contributing

This project follows the KISS principle. When contributing:

1. Keep solutions simple and straightforward
2. Avoid adding external dependencies
3. Maintain vanilla HTML/CSS/JavaScript approach
4. Ensure accessibility compliance
5. Test across different browsers and devices

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the IMPLEMENTATION_SUMMARY.md for technical details
3. Ensure your browser meets the compatibility requirements
