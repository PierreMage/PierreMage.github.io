# 💊 Medication Timing Calculator

A comprehensive web-based tool that helps users calculate optimal medication schedules based on dosing intervals and preferred start times.

## 🌟 Features

### Core Functionality
- **Flexible Dosing Intervals**: Support for any interval from 0.5 to 24 hours
- **Custom Start Times**: Set your preferred first dose time
- **Complete Daily Schedule**: Shows all doses within a 24-hour period
- **Time Format Options**: Choose between 12-hour (AM/PM) or 24-hour format
- **Midnight Crossover Handling**: Properly handles doses that extend past midnight

### Advanced Features
- **Real-time Calculation**: Automatic schedule updates as you change inputs - no button clicks required
- **Compact Form Design**: Streamlined interface with only essential inputs
- **24-Hour Format**: Consistent time display using 24-hour format for medical precision
- **Dark Theme Interface**: Modern dark color scheme optimized for comfortable viewing
- **Cross-browser Compatibility**: Optimized layout that works properly in all modern browsers including Firefox
- **Edge Case Warnings**: Alerts when dosing intervals don't divide evenly into 24 hours
- **Input Validation**: Comprehensive error checking with real-time feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: Screen reader friendly with proper ARIA labels and high contrast ratios
- **Medical Disclaimer**: Clear but concise disclaimer addressing proper usage and limitations

## 🚀 Usage

### Basic Usage
1. Open `index.html` in your web browser
2. Enter your dosing interval (e.g., 8 hours)
3. Set your preferred start time (e.g., 08:00)
4. Your medication schedule will appear automatically in 24-hour format as you make changes

### Example Scenarios

**Every 8 hours starting at 08:00:**
- Dose 1: 08:00
- Dose 2: 16:00
- Dose 3: 00:00 (midnight)

**Every 6 hours starting at 09:00:**
- Dose 1: 09:00
- Dose 2: 15:00
- Dose 3: 21:00
- Dose 4: 03:00 (next day)

## 📁 File Structure

```
medi-clock/
├── index.html          # Main application page
├── style.css           # Styling and responsive design
├── script.js           # Core functionality and calculations
├── test.html           # Automated test suite
└── README.md           # This documentation
```

## 🔧 Technical Implementation

### HTML Structure
- Semantic HTML5 with proper form elements
- Accessible form labels and descriptions
- Progressive enhancement approach

### CSS Features
- Modern CSS Grid and Flexbox layouts
- CSS custom properties for theming
- Responsive design with mobile-first approach
- Medical-themed color scheme with high contrast
- Smooth animations and transitions

### JavaScript Architecture
- **MedicationCalculator Class**: Main application logic
- **MedicationUtils Class**: Utility functions and enhancements
- **Modular Design**: Clean separation of concerns
- **Error Handling**: Comprehensive input validation
- **Edge Case Management**: Handles complex timing scenarios

### Key Algorithms

#### Schedule Calculation
```javascript
// Calculate number of doses in 24 hours
const maxDoses = Math.floor((24 * 60) / intervalMinutes);

// Generate dose times with midnight crossover handling
for (let i = 0; i < maxDoses; i++) {
    const doseTime = new Date(startDateTime);
    doseTime.setMinutes(doseTime.getMinutes() + (i * intervalMinutes));
    // Handle day transitions and formatting
}
```

#### Edge Case Handling
- **Imperfect Divisions**: Warns when intervals don't divide evenly into 24 hours
- **Midnight Crossover**: Properly displays times that cross into the next day
- **Input Validation**: Prevents invalid intervals and times

## 🧪 Testing

The application includes a comprehensive test suite (`test.html`) that validates:

- **Calculation Accuracy**: Verifies correct dose timing for various intervals
- **Edge Cases**: Tests midnight crossover and imperfect divisions
- **Common Scenarios**: Validates typical medication schedules
- **Input Validation**: Ensures proper error handling

### Running Tests
1. Open `test.html` in your browser
2. Tests run automatically and display results
3. Green results indicate passing tests
4. Red results show any calculation errors

## ⚠️ Important Disclaimers

This tool is for informational purposes only and does not provide medical advice. Key points:

- **Not Medical Advice**: This calculator cannot replace professional medical consultation
- **Consult Healthcare Providers**: Always consult your doctor before making medication decisions
- **Follow Prescriptions**: Your healthcare provider's instructions take precedence
- **Use at Own Risk**: Users assume responsibility for how they use this information
- **Emergency Situations**: Contact emergency services for medical emergencies

## 🎨 Design Principles

### User Experience
- **Simplicity**: Clean, intuitive interface
- **Clarity**: Clear labeling and instructions
- **Feedback**: Immediate validation and error messages
- **Accessibility**: WCAG compliant design

### Visual Design
- **Dark Medical Theme**: Professional healthcare-inspired dark color palette
- **High Contrast**: Optimized contrast ratios for accessibility and readability
- **Typography**: Clean, readable fonts (Inter)
- **Responsive**: Adapts to all screen sizes

## 🔮 Future Enhancements

Potential improvements for future versions:
- **Multiple Medications**: Support for tracking multiple medication schedules
- **Reminder Integration**: Calendar and notification system integration
- **Dose History**: Track when doses were actually taken
- **Export Options**: PDF or calendar export functionality
- **Offline Support**: Progressive Web App capabilities

## 🤝 Contributing

This is a standalone web application that can be easily modified:
1. Fork or download the project
2. Make your changes to the HTML, CSS, or JavaScript files
3. Test your changes using the included test suite
4. Ensure responsive design works across devices

## 📄 License

This project is open source and available for personal and educational use.

---

**Remember**: Always consult with healthcare professionals for medical advice and follow their specific instructions for your medications.
