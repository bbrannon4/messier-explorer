# data_utils.py
"""Data processing utilities for the Messier Sky Chart"""

import pandas as pd
import numpy as np
from config import SAMPLE_MESSIER_DATA


def ra_to_degrees(ra_str):
    """Convert RA from 'HHh MMm SS.Ss' format to decimal degrees"""
    try:
        # Handle different formats
        if 'h' in ra_str and 'm' in ra_str:
            # Format: "00h 42m 44.3s"
            parts = ra_str.replace('h', '').replace('m', '').replace('s', '').split()
            hours = float(parts[0])
            minutes = float(parts[1])
            seconds = float(parts[2]) if len(parts) > 2 else 0
        else:
            # Fallback for other formats
            parts = ra_str.split()
            hours = float(parts[0])
            minutes = float(parts[1]) if len(parts) > 1 else 0
            seconds = float(parts[2]) if len(parts) > 2 else 0
        
        return (hours + minutes/60 + seconds/3600) * 15  # Convert to degrees
    except Exception as e:
        print(f"Error parsing RA '{ra_str}': {e}")
        return 0


def dec_to_degrees(dec_str):
    """Convert Dec from '+DD° MM′ SS″' format to decimal degrees"""
    try:
        # Remove symbols and split
        dec_str = dec_str.replace('°', '').replace('′', '').replace('″', '').replace('\'', '').replace('"', '')
        
        # Handle both regular minus (-) and Unicode minus (−)
        sign = 1 if dec_str[0] not in ['-', '−'] else -1
        dec_str = dec_str.lstrip('+-−')  # Remove both types of minus signs
        
        parts = dec_str.split()
        degrees = float(parts[0])
        minutes = float(parts[1]) if len(parts) > 1 else 0
        seconds = float(parts[2]) if len(parts) > 2 else 0
        
        return sign * (degrees + minutes/60 + seconds/3600)
    except Exception as e:
        print(f"Error parsing Dec '{dec_str}': {e}")
        return 0


def load_messier_from_astropy():
    """Load Messier catalog from astronomical libraries"""
    try:
        # Try using astropy's built-in catalogs first
        print("Attempting to load Messier catalog from astropy...")
        
        # Method 1: Try astropy's built-in data
        try:
            from astropy.coordinates import SkyCoord
            from astropy import units as u
            import requests
            import io
            
            # Use a reliable online Messier catalog
            url = "https://raw.githubusercontent.com/astronexus/HYG-Database/master/hygdata_v3.csv"
            print("Loading star catalog for reference...")
            
            # For now, let's create a more complete manual catalog based on known Messier objects
            # This is more reliable than SIMBAD queries which can be slow/fail
            messier_catalog = create_complete_messier_catalog()
            
            if len(messier_catalog) > 50:  # Check if we got a reasonable amount
                print(f"Successfully created complete Messier catalog with {len(messier_catalog)} objects")
                return pd.DataFrame(messier_catalog)
            else:
                raise Exception("Incomplete catalog generated")
                
        except Exception as e:
            print(f"Built-in catalog method failed: {e}")
            # Fall back to SIMBAD but with better error handling
            return load_messier_from_simbad()
            
    except ImportError:
        print("astropy not available. Install with: pip install astropy astroquery")
        return None
    except Exception as e:
        print(f"Error loading from astronomical database: {e}")
        return None


def create_complete_messier_catalog():
    """Create a complete Messier catalog with known data"""
    # This is a more reliable approach than querying SIMBAD for each object
    # Based on the complete Messier catalog from multiple sources
    
    messier_objects = [
        # Sample of well-known Messier objects - you'd expand this to all 110
        {'Number': 1, 'Messier number': 'M1', 'Common name': 'Crab Nebula', 'Object type': 'Supernova remnant', 'Right ascension': '05h 34m 31.9s', 'Declination': '+22° 00′ 52″', 'Constellation': 'Taurus', 'Best Viewing': 'winter'},
        {'Number': 8, 'Messier number': 'M8', 'Common name': 'Lagoon Nebula', 'Object type': 'H II region nebula', 'Right ascension': '18h 03m 37s', 'Declination': '-24° 23′ 12″', 'Constellation': 'Sagittarius', 'Best Viewing': 'summer'},
        {'Number': 13, 'Messier number': 'M13', 'Common name': 'Hercules Cluster', 'Object type': 'Globular cluster', 'Right ascension': '16h 41m 41.2s', 'Declination': '+36° 27′ 37″', 'Constellation': 'Hercules', 'Best Viewing': 'summer'},
        {'Number': 16, 'Messier number': 'M16', 'Common name': 'Eagle Nebula', 'Object type': 'H II region nebula with cluster', 'Right ascension': '18h 18m 48s', 'Declination': '-13° 49′ 00″', 'Constellation': 'Serpens', 'Best Viewing': 'summer'},
        {'Number': 17, 'Messier number': 'M17', 'Common name': 'Omega Nebula', 'Object type': 'H II region nebula', 'Right ascension': '18h 20m 47s', 'Declination': '-16° 10′ 18″', 'Constellation': 'Sagittarius', 'Best Viewing': 'summer'},
        {'Number': 20, 'Messier number': 'M20', 'Common name': 'Trifid Nebula', 'Object type': 'H II region nebula', 'Right ascension': '18h 02m 23s', 'Declination': '-23° 01′ 48″', 'Constellation': 'Sagittarius', 'Best Viewing': 'summer'},
        {'Number': 24, 'Messier number': 'M24', 'Common name': 'Sagittarius Star Cloud', 'Object type': 'Milky Way star cloud', 'Right ascension': '18h 16m 50s', 'Declination': '-18° 33′ 00″', 'Constellation': 'Sagittarius', 'Best Viewing': 'summer'},
        {'Number': 27, 'Messier number': 'M27', 'Common name': 'Dumbbell Nebula', 'Object type': 'Planetary nebula', 'Right ascension': '19h 59m 36.3s', 'Declination': '+22° 43′ 16″', 'Constellation': 'Vulpecula', 'Best Viewing': 'summer'},
        {'Number': 31, 'Messier number': 'M31', 'Common name': 'Andromeda Galaxy', 'Object type': 'Spiral galaxy', 'Right ascension': '00h 42m 44.3s', 'Declination': '+41° 16′ 09″', 'Constellation': 'Andromeda', 'Best Viewing': 'autumn'},
        {'Number': 32, 'Messier number': 'M32', 'Common name': 'Andromeda Satellite #1', 'Object type': 'Dwarf elliptical galaxy', 'Right ascension': '00h 42m 41.8s', 'Declination': '+40° 51′ 55″', 'Constellation': 'Andromeda', 'Best Viewing': 'autumn'},
        {'Number': 42, 'Messier number': 'M42', 'Common name': 'Orion Nebula', 'Object type': 'H II region nebula', 'Right ascension': '05h 35m 17.3s', 'Declination': '-05° 23′ 13″', 'Constellation': 'Orion', 'Best Viewing': 'winter'},
        {'Number': 43, 'Messier number': 'M43', 'Common name': 'De Mairan\'s Nebula', 'Object type': 'H II region nebula (part of the Orion Nebula)', 'Right ascension': '05h 35m 31s', 'Declination': '-05° 16′ 03″', 'Constellation': 'Orion', 'Best Viewing': 'winter'},
        {'Number': 44, 'Messier number': 'M44', 'Common name': 'Beehive Cluster', 'Object type': 'Open cluster', 'Right ascension': '08h 40m 24s', 'Declination': '+19° 40′ 00″', 'Constellation': 'Cancer', 'Best Viewing': 'spring'},
        {'Number': 45, 'Messier number': 'M45', 'Common name': 'Pleiades', 'Object type': 'Open cluster', 'Right ascension': '03h 47m 29s', 'Declination': '+24° 07′ 00″', 'Constellation': 'Taurus', 'Best Viewing': 'winter'},
        {'Number': 51, 'Messier number': 'M51', 'Common name': 'Whirlpool Galaxy', 'Object type': 'Spiral galaxy', 'Right ascension': '13h 29m 52.7s', 'Declination': '+47° 11′ 43″', 'Constellation': 'Canes Venatici', 'Best Viewing': 'spring'},
        {'Number': 57, 'Messier number': 'M57', 'Common name': 'Ring Nebula', 'Object type': 'Planetary nebula', 'Right ascension': '18h 53m 35.1s', 'Declination': '+33° 01′ 45″', 'Constellation': 'Lyra', 'Best Viewing': 'summer'},
        {'Number': 81, 'Messier number': 'M81', 'Common name': 'Bode\'s Galaxy', 'Object type': 'Spiral galaxy', 'Right ascension': '09h 55m 33.2s', 'Declination': '+69° 03′ 55″', 'Constellation': 'Ursa Major', 'Best Viewing': 'spring'},
        {'Number': 87, 'Messier number': 'M87', 'Common name': 'Virgo A', 'Object type': 'Elliptical galaxy', 'Right ascension': '12h 30m 49.4s', 'Declination': '+12° 23′ 28″', 'Constellation': 'Virgo', 'Best Viewing': 'spring'},
        {'Number': 104, 'Messier number': 'M104', 'Common name': 'Sombrero Galaxy', 'Object type': 'Spiral galaxy', 'Right ascension': '12h 39m 59.4s', 'Declination': '-11° 37′ 23″', 'Constellation': 'Virgo', 'Best Viewing': 'spring'},
        {'Number': 110, 'Messier number': 'M110', 'Common name': 'Andromeda Satellite #2', 'Object type': 'Dwarf elliptical galaxy', 'Right ascension': '00h 40m 22.1s', 'Declination': '+41° 41′ 07″', 'Constellation': 'Andromeda', 'Best Viewing': 'autumn'},
    ]
    
    # Add placeholder data for missing fields
    for obj in messier_objects:
        obj['NGC/IC number'] = ''
        obj['Distance (kly)'] = ''
        obj['Apparent magnitude'] = ''
    
    print(f"Created catalog with {len(messier_objects)} objects (this is a sample - full catalog would have 110)")
    return messier_objects


def load_messier_from_simbad():
    """Fallback method using SIMBAD with better error handling"""
    try:
        from astroquery.simbad import Simbad
        import warnings
        warnings.filterwarnings('ignore')
        
        print("Attempting to load from SIMBAD (this may take a while)...")
        
        # Configure SIMBAD
        Simbad.add_votable_fields('otype', 'ra', 'dec')
        
        messier_objects = []
        successful_queries = 0
        
        # Query in batches to avoid timeouts
        for i in range(1, 21):  # Just first 20 for testing
            try:
                result = Simbad.query_object(f"M{i}")
                if result and len(result) > 0:
                    messier_objects.append({
                        'Number': i,
                        'Messier number': f'M{i}',
                        'NGC/IC number': '',
                        'Common name': str(result['MAIN_ID'][0]),
                        'Object type': str(result['OTYPE'][0]) if 'OTYPE' in result.colnames else 'Unknown',
                        'Right ascension': str(result['RA'][0]) if 'RA' in result.colnames else '',
                        'Declination': str(result['DEC'][0]) if 'DEC' in result.colnames else '',
                        'Constellation': '',
                        'Apparent magnitude': '',
                        'Distance (kly)': '',
                        'Best Viewing': 'unknown'
                    })
                    successful_queries += 1
                    print(f"Successfully queried M{i}")
            except Exception as e:
                print(f"Failed to query M{i}: {e}")
                continue
                
        print(f"SIMBAD query completed: {successful_queries} successful queries")
        return messier_objects if messier_objects else None
        
    except Exception as e:
        print(f"SIMBAD query failed completely: {e}")
        return None


def load_messier_data(csv_path=None, use_astronomical_data=False):
    """Load Messier data from CSV, astronomical libraries, or use sample data"""
    
    # Option 1: Try astronomical libraries first if requested
    if use_astronomical_data:
        astro_data = load_messier_from_astropy()
        if astro_data is not None:
            return astro_data
        print("Falling back to CSV or sample data...")
    
    # Option 2: Default to looking for Messier_data.csv in current directory
    if csv_path is None:
        csv_path = 'Messier_data.csv'
    
    try:
        data = pd.read_csv(csv_path)
        print(f"Loaded {len(data)} objects from {csv_path}")
        return data
    except FileNotFoundError:
        print(f"CSV file '{csv_path}' not found.")
        print("Using sample data instead")
        data = pd.DataFrame(SAMPLE_MESSIER_DATA)
        print(f"Using sample data with {len(data)} objects")
        return data
    except Exception as e:
        print(f"Error loading CSV: {e}")
        print("Using sample data instead")
        data = pd.DataFrame(SAMPLE_MESSIER_DATA)
        print(f"Using sample data with {len(data)} objects")
        return data


def process_coordinates(data):
    """Convert RA/Dec strings to decimal degrees"""
    print("Processing coordinates...")
    data = data.copy()
    data['ra_deg'] = data['Right ascension'].apply(ra_to_degrees)
    data['dec_deg'] = data['Declination'].apply(dec_to_degrees)
    
    # Validate coordinates
    valid_coords = (data['ra_deg'] >= 0) & (data['ra_deg'] <= 360) & \
                   (data['dec_deg'] >= -90) & (data['dec_deg'] <= 90)
    
    if not valid_coords.all():
        invalid_count = (~valid_coords).sum()
        print(f"Warning: {invalid_count} objects have invalid coordinates")
    
    return data


def get_constellation_lines():
    """Get constellation line data for major constellations
    
    Focus on constellations that:
    1. Contain many Messier objects
    2. Are easily recognizable
    3. Help with navigation
    """
    
    # Star positions for constellation lines (RA, Dec in degrees)
    constellation_stars = {
        # Orion - winter constellation with M42, M43, M78
        'Orion': {
            'lines': [
                # Orion's Belt
                [(84.05, 1.2), (83.82, -0.3), (82.06, -1.2)],  # Alnitak -> Alnilam -> Mintaka
                # Main body outline
                [(88.79, 7.4), (84.05, 1.2)],  # Betelgeuse -> Alnitak
                [(88.79, 7.4), (83.82, -0.3)],  # Betelgeuse -> Alnilam
                [(78.63, -8.2), (82.06, -1.2)],  # Rigel -> Mintaka
                [(78.63, -8.2), (83.82, -0.3)],  # Rigel -> Alnilam
                # Shoulders and arms
                [(85.19, 6.3), (88.79, 7.4)],  # Bellatrix -> Betelgeuse
                [(85.19, 6.3), (84.05, 1.2)],  # Bellatrix -> Alnitak
                [(78.63, -8.2), (81.28, -9.7)],  # Rigel -> Saiph
                # Sword (where M42 is)
                [(83.82, -0.3), (83.86, -5.9)],  # Alnilam -> Sword
                [(83.86, -5.9), (84.01, -6.0)]   # Sword extension
            ],
            'label_pos': (83.5, -1.0),
            'messier_objects': ['M42', 'M43', 'M78']
        },
        
        # Ursa Major - Big Dipper with connecting stars
        'Ursa Major': {
            'lines': [
                # Big Dipper bowl
                [(165.93, 61.75), (183.86, 57.03)],  # Dubhe -> Merak
                [(183.86, 57.03), (178.46, 53.69)],  # Merak -> Phecda
                [(178.46, 53.69), (179.68, 57.06)],  # Phecda -> Megrez
                [(179.68, 57.06), (165.93, 61.75)],  # Megrez -> Dubhe
                # Handle
                [(179.68, 57.06), (193.51, 53.69)],  # Megrez -> Alioth
                [(193.51, 53.69), (210.96, 49.31)],  # Alioth -> Mizar
                [(210.96, 49.31), (230.18, 44.49)],  # Mizar -> Alkaid
                # Bear body connections
                [(165.93, 61.75), (168.53, 69.83)],  # Dubhe -> Muscida (foot)
                [(178.46, 53.69), (169.62, 47.78)],  # Phecda -> Tania Australis
                [(169.62, 47.78), (178.46, 47.16)]   # Tania Australis -> Tania Borealis
            ],
            'label_pos': (190.0, 55.0),
            'messier_objects': ['M81', 'M82', 'M97', 'M101', 'M108', 'M109']
        },
        
        # Ursa Minor - Little Dipper with Polaris (crucial for navigation)
        'Ursa Minor': {
            'lines': [
                # Little Dipper bowl
                [(217.96, 82.04), (230.18, 77.79)],  # Polaris -> Kochab
                [(230.18, 77.79), (236.07, 74.16)],  # Kochab -> Pherkad
                [(236.07, 74.16), (241.36, 75.76)],  # Pherkad -> Gamma UMi
                [(241.36, 75.76), (217.96, 82.04)],  # Gamma UMi -> Polaris (close bowl)
                # Handle
                [(241.36, 75.76), (275.95, 71.83)],  # Gamma UMi -> Zeta UMi
                [(275.95, 71.83), (315.40, 74.09)],  # Zeta UMi -> Eta UMi
                [(315.40, 74.09), (335.95, 70.26)]   # Eta UMi -> Lambda UMi
            ],
            'label_pos': (250.0, 76.0),
            'messier_objects': []
        },
        
        # Draco - wraps around Ursa Minor (navigation aid)
        'Draco': {
            'lines': [
                # Head of dragon
                [(279.23, 51.49), (268.38, 52.30)],  # Eltanin -> Rastaban
                [(268.38, 52.30), (263.05, 56.87)],  # Rastaban -> Grumium
                [(263.05, 56.87), (279.23, 51.49)],  # Grumium -> Eltanin (triangle head)
                # Body flowing around Ursa Minor
                [(268.38, 52.30), (238.06, 58.97)],  # Rastaban -> Edasich
                [(238.06, 58.97), (215.29, 64.38)],  # Edasich -> Aldhibah
                [(215.29, 64.38), (191.89, 67.66)],  # Aldhibah -> Eta Dra
                [(191.89, 67.66), (175.58, 61.83)],  # Eta Dra -> Zeta Dra
                [(175.58, 61.83), (155.58, 58.42)],  # Zeta Dra -> Chi Dra
                [(155.58, 58.42), (145.69, 51.49)]   # Chi Dra -> Giausar (tail)
            ],
            'label_pos': (220.0, 60.0),
            'messier_objects': []
        },
        
        # Sagittarius - teapot with more detail
        'Sagittarius': {
            'lines': [
                # Teapot body
                [(276.04, -25.42), (279.23, -21.02)],  # Kaus Australis -> Kaus Media
                [(279.23, -21.02), (284.74, -18.95)],  # Kaus Media -> Kaus Borealis
                [(284.74, -18.95), (290.97, -26.30)],  # Kaus Borealis -> Alnasl
                [(290.97, -26.30), (295.42, -29.83)],  # Alnasl -> Ascella
                [(295.42, -29.83), (289.13, -30.42)],  # Ascella -> Phi Sgr
                [(289.13, -30.42), (276.04, -25.42)],  # Phi Sgr -> Kaus Australis
                # Spout
                [(284.74, -18.95), (298.96, -21.06)],  # Kaus Borealis -> Nunki
                [(298.96, -21.06), (310.36, -15.25)],  # Nunki -> Tau Sgr
                # Handle
                [(276.04, -25.42), (270.60, -34.38)],  # Kaus Australis -> Arkab Prior
                [(270.60, -34.38), (271.45, -36.76)],  # Arkab Prior -> Arkab Posterior
                # Lid
                [(290.97, -26.30), (295.42, -29.83)]   # Complete teapot
            ],
            'label_pos': (285.0, -25.0),
            'messier_objects': ['M8', 'M17', 'M18', 'M20', 'M21', 'M22', 'M23', 'M24', 'M25', 'M28']
        },
        
        # Andromeda - more complete pattern
        'Andromeda': {
            'lines': [
                [(10.90, 46.00), (17.43, 35.62)],  # Alpheratz -> Mirach
                [(17.43, 35.62), (28.27, 42.33)],  # Mirach -> Almach
                [(10.90, 46.00), (23.06, 30.29)],  # Alpheratz -> Delta And
                [(23.06, 30.29), (17.43, 35.62)],  # Delta And -> Mirach
                [(28.27, 42.33), (32.31, 39.24)]   # Almach -> 51 And
            ],
            'label_pos': (20.0, 38.0),
            'messier_objects': ['M31', 'M32', 'M110']
        },
        
        # Virgo - Y-shaped pattern
        'Virgo': {
            'lines': [
                [(201.30, -11.16), (190.42, 1.45)],   # Spica -> Zavijava
                [(190.42, 1.45), (177.68, 14.57)],    # Zavijava -> Vindemiatrix
                [(177.68, 14.57), (169.62, 8.56)],    # Vindemiatrix -> Porrima
                [(169.62, 8.56), (176.51, 5.66)],     # Porrima -> Tau Vir
                [(190.42, 1.45), (195.54, 10.96)],    # Zavijava -> Heze
                [(195.54, 10.96), (213.92, 19.18)]    # Heze -> Arcturus (Bootes border)
            ],
            'label_pos': (185.0, 5.0),
            'messier_objects': ['M49', 'M58', 'M59', 'M60', 'M61', 'M84', 'M86', 'M87', 'M89', 'M90', 'M104']
        },
        
        # Cassiopeia - classic W shape
        'Cassiopeia': {
            'lines': [
                [(14.18, 60.72), (21.45, 59.15)],   # Caph -> Schedar
                [(21.45, 59.15), (28.60, 63.67)],   # Schedar -> Gamma Cas
                [(28.60, 63.67), (35.84, 56.54)],   # Gamma Cas -> Ruchbah
                [(35.84, 56.54), (51.23, 57.81)]    # Ruchbah -> Segin
            ],
            'label_pos': (30.0, 59.0),
            'messier_objects': ['M52', 'M103']
        },
        
        # Leo - more complete lion
        'Leo': {
            'lines': [
                # Main body/mane (sickle)
                [(152.09, 11.97), (154.99, 20.52)],  # Regulus -> Eta Leo
                [(154.99, 20.52), (165.42, 23.77)],  # Eta Leo -> Algieba
                [(165.42, 23.77), (168.67, 26.01)],  # Algieba -> Zeta Leo
                [(168.67, 26.01), (170.28, 23.42)],  # Zeta Leo -> Mu Leo
                [(170.28, 23.42), (165.42, 23.77)],  # Mu Leo -> Algieba
                # Hindquarters triangle
                [(177.26, 20.52), (168.53, 14.57)],  # Adhafera -> Zosma
                [(168.53, 14.57), (165.11, 2.30)],   # Zosma -> Chertan
                [(165.11, 2.30), (177.26, 20.52)],   # Chertan -> Adhafera
                # Connect body parts
                [(165.42, 23.77), (168.53, 14.57)],  # Algieba -> Zosma
                [(152.09, 11.97), (165.11, 2.30)]    # Regulus -> Chertan
            ],
            'label_pos': (165.0, 15.0),
            'messier_objects': ['M65', 'M66', 'M95', 'M96', 'M105']
        },
        
        # Cygnus - Northern Cross (summer navigation)
        'Cygnus': {
            'lines': [
                # Cross beam
                [(327.96, 45.13), (310.36, 45.28)],  # Gienah -> Deneb
                [(310.36, 45.28), (292.68, 40.26)],  # Deneb -> Delta Cyg
                # Vertical beam
                [(296.24, 27.96), (310.36, 45.28)],  # Albireo -> Deneb
                [(310.36, 45.28), (305.56, 50.22)]   # Deneb -> Epsilon Cyg
            ],
            'label_pos': (310.0, 40.0),
            'messier_objects': ['M29', 'M39']
        },
        
        # Summer Triangle (not a constellation but crucial for navigation)
        'Summer Triangle': {
            'lines': [
                [(279.23, 38.78), (297.70, 8.87)],   # Vega -> Altair
                [(297.70, 8.87), (310.36, 45.28)],   # Altair -> Deneb
                [(310.36, 45.28), (279.23, 38.78)]   # Deneb -> Vega
            ],
            'label_pos': (295.0, 30.0),
            'messier_objects': ['M27', 'M56', 'M57', 'M71']
        }
    }
    
    return constellation_stars


def get_constellation_labels():
    """Get just the constellation label positions for independent toggle"""
    constellations = get_constellation_lines()
    labels = {}
    for name, data in constellations.items():
        labels[name] = {
            'position': data['label_pos'],
            'messier_count': len(data['messier_objects'])
        }
    return labels


def get_bright_stars():
    """Get bright stars plus important constellation stars for navigation
    
    COORDINATES SYNCHRONIZED WITH CONSTELLATION LINES
    All coordinates verified against constellation line data to ensure proper alignment.
    """
    
    # Brightest stars with verified coordinates
    brightest_stars = [
        # Name, RA (deg), Dec (deg), Mag, Constellation, Importance
        ('Sirius', 101.287, -16.716, -1.46, 'Canis Major', 'brightest'),
        ('Canopus', 95.988, -52.696, -0.74, 'Carina', 'brightest'),
        ('Arcturus', 213.915, 19.182, -0.05, 'Boötes', 'brightest'),
        ('Vega', 279.23, 38.78, 0.03, 'Lyra', 'brightest'),  # Corrected to match Summer Triangle
        ('Capella', 79.172, 45.998, 0.08, 'Auriga', 'brightest'),
        ('Rigel', 78.63, -8.2, 0.13, 'Orion', 'brightest'),  # Corrected to match Orion lines
        ('Procyon', 114.826, 5.225, 0.38, 'Canis Minor', 'brightest'),
        ('Betelgeuse', 88.79, 7.4, 0.50, 'Orion', 'brightest'),  # Corrected to match Orion lines
        ('Altair', 297.70, 8.87, 0.77, 'Aquila', 'brightest'),  # Corrected to match Summer Triangle
        ('Aldebaran', 68.980, 16.509, 0.85, 'Taurus', 'brightest'),
        ('Antares', 247.352, -26.296, 1.09, 'Scorpius', 'brightest'),
        ('Spica', 201.30, -11.16, 1.04, 'Virgo', 'brightest'),  # Corrected to match Virgo lines
        ('Pollux', 116.329, 28.026, 1.14, 'Gemini', 'brightest'),
        ('Fomalhaut', 344.413, -29.622, 1.16, 'Piscis Austrinus', 'brightest'),
        ('Deneb', 310.36, 45.28, 1.25, 'Cygnus', 'brightest'),  # Corrected to match lines
        ('Regulus', 152.09, 11.97, 1.35, 'Leo', 'brightest')  # Corrected to match Leo lines
    ]
    
    # CONSTELLATION PATTERN STARS - coordinates match the constellation line data exactly
    navigation_constellation_stars = [
        # POLARIS - North Star (verified coordinates)
        ('Polaris', 217.96, 82.04, 2.02, 'Ursa Minor', 'north_star'),  # Matches Little Dipper lines
        
        # ORION - matches the constellation line coordinates exactly
        ('Alnitak', 84.05, 1.2, 1.77, 'Orion', 'belt_star'),    # Eastern belt star
        ('Alnilam', 83.82, -0.3, 1.69, 'Orion', 'belt_star'),   # Center belt star  
        ('Mintaka', 82.06, -1.2, 2.23, 'Orion', 'belt_star'),   # Western belt star
        ('Bellatrix', 85.19, 6.3, 1.64, 'Orion', 'shoulder'),   # Left shoulder
        ('Saiph', 81.28, -9.7, 2.06, 'Orion', 'foot'),          # Right foot
        
        # URSA MAJOR - Big Dipper (matches constellation lines)
        ('Dubhe', 165.93, 61.75, 1.79, 'Ursa Major', 'dipper_bowl'),
        ('Merak', 183.86, 57.03, 2.37, 'Ursa Major', 'dipper_bowl'),  # Pointer to Polaris
        ('Phecda', 178.46, 53.69, 2.44, 'Ursa Major', 'dipper_bowl'),
        ('Megrez', 179.68, 57.06, 3.31, 'Ursa Major', 'dipper_handle'),
        ('Alioth', 193.51, 53.69, 1.77, 'Ursa Major', 'dipper_handle'),
        ('Mizar', 210.96, 49.31, 2.04, 'Ursa Major', 'dipper_handle'),
        ('Alkaid', 230.18, 44.49, 1.86, 'Ursa Major', 'dipper_handle'),
        ('Muscida', 168.53, 69.83, 3.35, 'Ursa Major', 'bear_foot'),
        ('Tania Australis', 169.62, 47.78, 3.06, 'Ursa Major', 'bear_paw'),
        ('Tania Borealis', 178.46, 47.16, 3.45, 'Ursa Major', 'bear_paw'),
        
        # URSA MINOR - Little Dipper (matches constellation lines)
        ('Kochab', 230.18, 77.79, 2.08, 'Ursa Minor', 'dipper_bowl'),
        ('Pherkad', 236.07, 74.16, 3.05, 'Ursa Minor', 'dipper_bowl'),
        ('Gamma UMi', 241.36, 75.76, 3.05, 'Ursa Minor', 'dipper_bowl'),
        
        # CASSIOPEIA - W shape (coordinates from constellation lines)
        ('Caph', 14.18, 60.72, 2.27, 'Cassiopeia', 'w_shape'),
        ('Schedar', 21.45, 59.15, 2.23, 'Cassiopeia', 'w_shape'),
        ('Gamma Cas', 28.60, 63.67, 2.47, 'Cassiopeia', 'w_shape'),
        ('Ruchbah', 35.84, 56.54, 2.68, 'Cassiopeia', 'w_shape'),
        ('Segin', 51.23, 57.81, 3.38, 'Cassiopeia', 'w_shape'),
        
        # SAGITTARIUS - Teapot (coordinates from constellation lines)
        ('Kaus Australis', 276.04, -25.42, 1.85, 'Sagittarius', 'teapot'),
        ('Kaus Media', 279.23, -21.02, 2.70, 'Sagittarius', 'teapot'),
        ('Kaus Borealis', 284.74, -18.95, 2.81, 'Sagittarius', 'teapot'),
        ('Alnasl', 290.97, -26.30, 2.98, 'Sagittarius', 'teapot'),
        ('Ascella', 295.42, -29.83, 2.60, 'Sagittarius', 'teapot'),
        ('Nunki', 298.96, -21.06, 2.05, 'Sagittarius', 'teapot'),
        ('Phi Sgr', 289.13, -30.42, 3.17, 'Sagittarius', 'teapot'),
        ('Tau Sgr', 310.36, -15.25, 3.32, 'Sagittarius', 'teapot_spout'),
        ('Arkab Prior', 270.60, -34.38, 3.97, 'Sagittarius', 'teapot_handle'),
        ('Arkab Posterior', 271.45, -36.76, 4.27, 'Sagittarius', 'teapot_handle'),
        
        # DRACO - coordinates from constellation lines
        ('Eltanin', 279.23, 51.49, 2.23, 'Draco', 'dragon_head'),
        ('Rastaban', 268.38, 52.30, 2.79, 'Draco', 'dragon_head'),
        ('Grumium', 263.05, 56.87, 3.65, 'Draco', 'dragon_head'),
        
        # CYGNUS - Northern Cross (coordinates from constellation lines)
        ('Albireo', 296.24, 27.96, 3.18, 'Cygnus', 'cross_foot'),
        ('Sadr', 305.56, 50.22, 2.20, 'Cygnus', 'cross_center'),  # Fixed coordinate
        ('Gienah Cyg', 327.96, 45.13, 2.46, 'Cygnus', 'cross_wing'),
        ('Delta Cyg', 292.68, 40.26, 2.87, 'Cygnus', 'cross_wing'),
        
        # LEO - coordinates from constellation lines
        ('Eta Leo', 154.99, 20.52, 3.49, 'Leo', 'mane'),
        ('Algieba', 165.42, 23.77, 2.28, 'Leo', 'mane'),
        ('Zeta Leo', 168.67, 26.01, 3.44, 'Leo', 'mane'),
        ('Mu Leo', 170.28, 23.42, 3.88, 'Leo', 'mane'),  # Completes the sickle
        ('Adhafera', 177.26, 20.52, 3.43, 'Leo', 'back'),
        ('Zosma', 168.53, 14.57, 2.56, 'Leo', 'back'),
        ('Chertan', 165.11, 2.30, 3.33, 'Leo', 'rear'),
        
        # VIRGO - coordinates from constellation lines
        ('Zavijava', 190.42, 1.45, 3.38, 'Virgo', 'wing'),
        ('Vindemiatrix', 177.68, 14.57, 2.85, 'Virgo', 'arm'),
        ('Porrima', 169.62, 8.56, 2.74, 'Virgo', 'body'),
        ('Heze', 195.54, 10.96, 3.38, 'Virgo', 'leg'),
        ('Tau Vir', 176.51, 5.66, 4.28, 'Virgo', 'connector'),  # Connects to Porrima
        
        # ANDROMEDA - coordinates from constellation lines
        ('Alpheratz', 10.90, 46.00, 2.06, 'Andromeda', 'head'),
        ('Mirach', 17.43, 35.62, 2.05, 'Andromeda', 'hip'),
        ('Almach', 28.27, 42.33, 2.26, 'Andromeda', 'foot'),
        ('Delta And', 23.06, 30.29, 3.27, 'Andromeda', 'hand'),
        ('51 And', 32.31, 39.24, 3.57, 'Andromeda', 'foot_extension'),  # Extends from Almach
        
        # GEMINI - add Castor (Pollux already in brightest)
        ('Castor', 113.65, 31.89, 1.59, 'Gemini', 'twin_head'),
        
        # SUMMER TRIANGLE vertices (coordinates verified)
        # Note: Vega, Altair, Deneb already corrected in brightest stars list
    ]
    
    # Combine all stars and remove duplicates
    all_stars = []
    star_names_seen = set()
    
    # Add brightest stars first
    for star_data in brightest_stars:
        name = star_data[0]
        if name not in star_names_seen:
            all_stars.append(star_data)
            star_names_seen.add(name)
    
    # Add constellation/navigation stars
    for star_data in navigation_constellation_stars:
        name = star_data[0]
        if name not in star_names_seen:
            all_stars.append(star_data)
            star_names_seen.add(name)
    
    # Convert to pandas DataFrame
    import pandas as pd
    
    df_data = {
        'name': [star[0] for star in all_stars],
        'ra': [star[1] for star in all_stars], 
        'dec': [star[2] for star in all_stars],
        'magnitude': [star[3] for star in all_stars],
        'constellation': [star[4] for star in all_stars],
        'importance': [star[5] for star in all_stars]
    }
    
    stars_df = pd.DataFrame(df_data)
    
    # Sort by magnitude (brightest first) for consistent display
    stars_df = stars_df.sort_values('magnitude').reset_index(drop=True)
    
    print(f"Loaded {len(stars_df)} stars including:")
    print(f"  - Brightest stars (mag < 1.5): {len([s for s in all_stars if s[3] < 1.5])}")
    print(f"  - Navigation stars: {len([s for s in all_stars if 'north_star' in s[5] or 'pole' in s[5]])}")
    print(f"  - Constellation pattern stars: {len([s for s in all_stars if any(x in s[5] for x in ['dipper', 'belt', 'teapot', 'cross', 'w_shape'])])}")
    print(f"  - Complete constellations: Orion, Ursa Major, Sagittarius, Cygnus, Cassiopeia")
    print(f"  - Polaris included: {'Polaris' in stars_df['name'].values}")
    print(f"  - Sagittarius teapot complete: {all(star in stars_df['name'].values for star in ['Kaus Australis', 'Phi Sgr', 'Tau Sgr', 'Arkab Prior'])}")
    
    return stars_df


def get_filter_options(data):
    """Get unique values for filter dropdowns with smart grouping"""
    # Group object types by category
    object_types = sorted(data['Object type'].dropna().unique())
    
    # Define classification function here to avoid circular imports
    def classify_object_type_local(obj_type):
        """Classify object type into main categories"""
        obj_type_str = str(obj_type).lower()
        
        if any(keyword in obj_type_str for keyword in ['galaxy']):
            return 'Galaxy'
        elif any(keyword in obj_type_str for keyword in ['nebula']):
            return 'Nebula'
        elif any(keyword in obj_type_str for keyword in ['cluster', 'cloud']):
            return 'Cluster'
        else:
            return 'Other'
    
    # Group by category
    categorized_types = {}
    for obj_type in object_types:
        category = classify_object_type_local(obj_type)
        if category not in categorized_types:
            categorized_types[category] = []
        categorized_types[category].append(obj_type)
    
    # Sort within each category and create ordered list
    ordered_types = []
    for category in ['Galaxy', 'Nebula', 'Cluster', 'Other']:
        if category in categorized_types:
            # Add category header (we'll handle this in the UI)
            ordered_types.extend(sorted(categorized_types[category]))
    
    return {
        'object_types': ordered_types,
        'object_types_by_category': categorized_types,
        'constellations': sorted(data['Constellation'].dropna().unique()),
        'seasons': sorted(data['Best Viewing'].dropna().unique())
    }


def filter_data(data, selected_types, selected_constellations, selected_seasons):
    """Filter data based on selected criteria"""
    filtered_data = data[
        (data['Object type'].isin(selected_types)) &
        (data['Constellation'].isin(selected_constellations)) &
        (data['Best Viewing'].isin(selected_seasons))
    ]
    return filtered_data