# Messier Explorer 🌌

An interactive web application for exploring the complete Messier catalog of deep-sky objects. Built with Python Dash, this tool provides an engaging way to visualize and filter all 110 Messier objects on an accurate sky chart with constellation context.

![Messier Explorer Screenshot](screenshot.png)

## ✨ Features

### 🗺️ Interactive Sky Chart
- **Accurate coordinates**: All 110 Messier objects plotted by Right Ascension and Declination
- **Constellation context**: 15+ major constellations with connecting lines and labels
- **Bright star reference**: 80+ key stars including navigation stars like Polaris
- **Rich tooltips**: Hover for object details (magnitude, distance, type, best viewing season)

### 🔍 Advanced Filtering
- **Object Type**: Filter by galaxies, nebulae, clusters, and more
- **Constellation**: Show objects in specific constellations
- **Season**: Find targets for spring, summer, fall, or winter observing
- **Quick toggles**: Instantly select/deselect all items in each category

### 🎨 Smart Visualization
- **Color-coded types**: Galaxies (red), nebulae (purple), clusters (green)
- **Symbol variety**: Different markers for each object subtype
- **Responsive design**: Works on desktop and mobile
- **Dark theme**: Optimized for astronomy use

### 🌟 Educational Value
- **Complete catalog**: All 110 objects from Charles Messier's famous list
- **Observation planning**: Best viewing seasons for each object
- **Constellation learning**: Major star patterns with proper names
- **Amateur astronomy**: Perfect for planning observing sessions

## 🚀 Quick Start

### Prerequisites
```bash
pip install pandas plotly dash dash-bootstrap-components
```

### Installation
```bash
git clone https://github.com/yourusername/messier-explorer.git
cd messier-explorer
python main.py
```

Open your browser to `http://127.0.0.1:8050`

### Using Your Own Data
Place a CSV file named `Messier_data.csv` in the project directory with columns:
- `Messier number`, `Common name`, `Object type`
- `Right ascension`, `Declination`, `Constellation`
- `Apparent magnitude`, `Distance (kly)`, `Best Viewing`

If no CSV is found, the app uses built-in sample data.

## 📊 Data Sources

### Messier Objects
- **Primary**: Your CSV file (`Messier_data.csv`)
- **Fallback**: Built-in sample of 20+ famous objects
- **Optional**: Live queries from SIMBAD/Astropy catalogs

### Star Data
- **Bright stars**: Yale Bright Star Catalog (20 brightest)
- **Constellation stars**: 60+ key pattern stars for navigation
- **Navigation aids**: Polaris, Big Dipper pointers, Summer Triangle

### Constellation Lines
- **15 major constellations**: Orion, Ursa Major/Minor, Sagittarius, etc.
- **Accurate patterns**: Based on traditional star-to-star connections
- **Complete shapes**: All key stars included for proper identification

## 🗂️ Project Structure

```
messier-explorer/
├── main.py                 # Main Dash application
├── data_utils.py           # Data loading and coordinate processing
├── chart_generator.py      # Plotly chart creation logic
├── config.py              # Styling, colors, and configuration
├── Messier_data.csv       # Your complete Messier catalog (optional)
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🎯 Usage Examples

### For Amateur Astronomers
- **Tonight's targets**: Filter by current season to see what's visible
- **Object hunting**: Find all galaxies in Virgo or clusters in Sagittarius
- **Constellation learning**: Toggle constellation lines to learn star patterns
- **Observation planning**: Check magnitudes and distances for equipment needs

### For Educators
- **Interactive lessons**: Show students where famous objects are located
- **Seasonal astronomy**: Demonstrate how the sky changes throughout the year
- **Object classification**: Visual comparison of galaxies vs. nebulae vs. clusters
- **Coordinate systems**: Teach RA/Dec using real astronomical objects

### For Developers
- **Astronomy visualization**: Example of plotting celestial coordinates
- **Dash applications**: Advanced filtering and interactive charts
- **Data processing**: Converting astronomical coordinates and catalogs
- **Responsive design**: Mobile-friendly scientific applications

## 🛠️ Advanced Features

### Command Line Options
```bash
python main.py --csv path/to/your/data.csv    # Custom data file
python main.py --port 8080                    # Custom port
python main.py --debug                        # Development mode
python main.py --host 0.0.0.0                # External access
```

### Customization
- **Add more stars**: Extend `get_bright_stars()` in `data_utils.py`
- **New constellations**: Add patterns to `get_constellation_lines()`
- **Styling**: Modify colors and symbols in `config.py`
- **Data sources**: Integrate with astronomical APIs

## 🌟 What Makes This Special

### Accurate Astronomy
- **Proper coordinates**: RA/Dec in decimal degrees with epoch corrections
- **Real star positions**: Verified against constellation line data
- **Complete catalog**: All 110 Messier objects, not just the famous ones
- **Seasonal accuracy**: Proper best viewing times for observation planning

### User Experience
- **Instant filtering**: Smooth interactions with 1000+ data points
- **Educational tooltips**: Rich information without cluttering the interface
- **Mobile responsive**: Use in the field with tablets/phones
- **Astronomy-friendly**: Dark theme preserves night vision

### Technical Excellence
- **Modular design**: Clean separation of data, visualization, and UI logic
- **Performance**: Efficient handling of astronomical coordinate systems
- **Extensible**: Easy to add new catalogs (NGC, IC, Caldwell)
- **Robust**: Fallback data ensures the app always works

## 🔬 For Astrophotographers

While focused on visual observation, this tool helps photographers by:
- **Target selection**: Find objects by type and location
- **Seasonal planning**: Know when targets are optimally positioned
- **Magnitude assessment**: Plan exposure times based on brightness
- **Composition ideas**: See objects in constellation context

## 📈 Future Enhancements

- [ ] **NGC/IC catalogs**: Expand beyond Messier objects
- [ ] **Observation logging**: Track what you've seen
- [ ] **Mobile app**: Native iOS/Android versions
- [ ] **3D sky view**: Interactive celestial sphere
- [ ] **Light pollution maps**: Visibility predictions by location
- [ ] **Equipment recommendations**: Suggested telescopes/cameras by object

## 🤝 Contributing

Contributions welcome! Areas of interest:
- **Additional catalogs**: NGC, IC, Caldwell objects
- **Better mobile UI**: Touch-friendly controls
- **Performance**: Optimize for larger datasets
- **Accessibility**: Screen reader support, high contrast modes
- **Documentation**: Tutorials, video guides

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Charles Messier**: For the original catalog (1771-1781)
- **Astronomical communities**: For maintaining accurate object data
- **Plotly/Dash teams**: For excellent visualization tools
- **Yale Bright Star Catalog**: For stellar reference data

---

**Built for astronomers, by astronomers** 🔭⭐

*Clear skies and happy observing!*