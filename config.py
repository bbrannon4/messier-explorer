# config.py
"""Configuration and styling settings for the Messier Sky Chart"""

# Object type classification and styling
OBJECT_CATEGORIES = {
    'Galaxy': {
        'base_symbol': 'circle',
        'base_color': '#FF6B6B',
        'keywords': ['galaxy', 'Galaxy']
    },
    'Nebula': {
        'base_symbol': 'square', 
        'base_color': '#DDA0DD',
        'keywords': ['nebula', 'Nebula']
    },
    'Cluster': {
        'base_symbol': 'star',
        'base_color': '#96CEB4', 
        'keywords': ['cluster', 'Cluster', 'cloud']
    },
    'Other': {
        'base_symbol': 'diamond',
        'base_color': '#FFEAA7',
        'keywords': []
    }
}

def classify_object_type(obj_type):
    """Classify object type into main categories"""
    obj_type_str = str(obj_type).lower()
    
    for category, config in OBJECT_CATEGORIES.items():
        for keyword in config['keywords']:
            if keyword.lower() in obj_type_str:
                return category
    return 'Other'

def get_object_style(obj_type):
    """Get styling for object type based on classification"""
    category = classify_object_type(obj_type)
    base_config = OBJECT_CATEGORIES[category]
    
    # Color variations within each category
    color_variations = {
        'Galaxy': {
            'spiral galaxy': '#FF6B6B',
            'elliptical galaxy': '#FF8E8E', 
            'dwarf elliptical galaxy': '#FFB1B1',
            'barred spiral galaxy': '#FF4848',
            'lenticular galaxy': '#FFA0A0',
            'starburst galaxy': '#FF2525'
        },
        'Nebula': {
            'planetary nebula': '#DDA0DD',
            'h ii region nebula': '#E6B3E6',
            'diffuse nebula': '#F0C6F0',
            'nebula with cluster': '#D187D1',
            'supernova remnant': '#C66EC6'
        },
        'Cluster': {
            'globular cluster': '#96CEB4',
            'open cluster': '#A8D4C1',
            'milky way star cloud': '#BCDACF'
        },
        'Other': {
            'optical double': '#FFEAA7',
            'asterism': '#FFE074'
        }
    }
    
    # Get specific color or use base color
    obj_type_lower = str(obj_type).lower()
    color = color_variations.get(category, {}).get(obj_type_lower, base_config['base_color'])
    
    # Symbol variations within category
    symbol_variations = {
        'Galaxy': {
            'spiral galaxy': 'circle',
            'elliptical galaxy': 'circle-open',
            'dwarf elliptical galaxy': 'circle-dot',
            'barred spiral galaxy': 'circle-cross',
            'lenticular galaxy': 'circle-x',
            'starburst galaxy': 'circle'
        },
        'Nebula': {
            'planetary nebula': 'square',
            'h ii region nebula': 'square-open',
            'diffuse nebula': 'square-dot',
            'nebula with cluster': 'square-cross',
            'supernova remnant': 'triangle-up'
        },
        'Cluster': {
            'globular cluster': 'star',
            'open cluster': 'star-open',
            'milky way star cloud': 'star-dot'
        },
        'Other': {
            'optical double': 'diamond',
            'asterism': 'diamond-open'
        }
    }
    
    symbol = symbol_variations.get(category, {}).get(obj_type_lower, base_config['base_symbol'])
    
    return {
        'symbol': symbol,
        'color': color,
        'size': 8,
        'category': category
    }

# Your actual object types
YOUR_OBJECT_TYPES = [
    'Supernova remnant',
    'Globular cluster', 
    'Open cluster',
    'Nebula with cluster',
    'H II region nebula with cluster',
    'Milky Way star cloud',
    'Planetary nebula',
    'Spiral galaxy',
    'Dwarf elliptical galaxy', 
    'Optical Double',
    'H II region nebula',
    'H II region nebula (part of the Orion Nebula)',
    'Elliptical galaxy',
    'Barred Spiral galaxy',
    'Asterism',
    'Diffuse nebula',
    'Starburst galaxy',
    'Lenticular galaxy'
]

# Auto-generate object styles
OBJECT_STYLES = {}
for obj_type in YOUR_OBJECT_TYPES:
    OBJECT_STYLES[obj_type] = get_object_style(obj_type)

# Add default style
OBJECT_STYLES['Default'] = {'symbol': 'circle', 'color': '#BDC3C7', 'size': 6, 'category': 'Other'}

# Chart appearance settings
CHART_CONFIG = {
    'background_color': '#0B1426',
    'paper_color': '#0B1426',
    'font_color': 'white',
    'grid_color': 'rgba(128,128,128,0.3)',
    'star_color': 'lightgray',
    'text_color': 'white',
    'default_width': 1200,
    'default_height': 800
}

# Coordinate settings
COORDINATE_CONFIG = {
    'ra_range': [360, 0],  # Reversed for astronomical convention
    'dec_range': [-90, 90],
    'ra_tick_interval': 30,
    'dec_tick_interval': 30
}

# Sample data for testing (replace with your CSV)
SAMPLE_MESSIER_DATA = {
    'Number': [31, 32, 1, 13, 42, 57, 27, 81, 51, 104],
    'Messier number': ['M31', 'M32', 'M1', 'M13', 'M42', 'M57', 'M27', 'M81', 'M51', 'M104'],
    'NGC/IC number': [224, 221, 1952, 6205, 1976, 6720, 6853, 3031, 5194, 4594],
    'Common name': ['Andromeda Galaxy', 'Andromeda Satellite #1', 'Crab Nebula', 'Hercules Cluster', 'Orion Nebula', 'Ring Nebula', 'Dumbbell Nebula', 'Bode\'s Galaxy', 'Whirlpool Galaxy', 'Sombrero Galaxy'],
    'Object type': ['Spiral galaxy', 'Dwarf elliptical galaxy', 'Supernova remnant', 'Globular cluster', 'Nebula', 'Planetary nebula', 'Planetary nebula', 'Spiral galaxy', 'Spiral galaxy', 'Spiral galaxy'],
    'Distance (kly)': [2540, 2490, 6.5, 25.1, 1.344, 2.3, 1.36, 11800, 23000, 31100],
    'Constellation': ['Andromeda', 'Andromeda', 'Taurus', 'Hercules', 'Orion', 'Lyra', 'Vulpecula', 'Ursa Major', 'Canes Venatici', 'Virgo'],
    'Apparent magnitude': [3.4, 8.1, 8.4, 5.8, 4.0, 8.8, 7.5, 6.9, 8.4, 8.0],
    'Right ascension': ['00h 42m 44.3s', '00h 42m 41.8s', '05h 34m 31.9s', '16h 41m 41.2s', '05h 35m 17.3s', '18h 53m 35.1s', '19h 59m 36.3s', '09h 55m 33.2s', '13h 29m 52.7s', '12h 39m 59.4s'],
    'Declination': ['+41° 16′ 09″', '+40° 51′ 55″', '+22° 00′ 52″', '+36° 27′ 37″', '-05° 23′ 13″', '+33° 01′ 45″', '+22° 43′ 16″', '+69° 03′ 55″', '+47° 11′ 43″', '-11° 37′ 23″'],
    'Best Viewing': ['autumn', 'autumn', 'winter', 'summer', 'winter', 'summer', 'summer', 'spring', 'spring', 'spring']
}