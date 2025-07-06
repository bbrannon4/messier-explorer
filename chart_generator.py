# chart_generator.py
"""Chart generation logic for the Messier Sky Chart"""

import plotly.graph_objects as go
import pandas as pd
from config import OBJECT_STYLES, CHART_CONFIG, COORDINATE_CONFIG, get_object_style
from data_utils import get_bright_stars, get_constellation_lines, get_constellation_labels


class MessierSkyChart:
    """Main class for creating and managing the Messier sky chart"""
    
    def __init__(self, messier_data):
        self.messier_data = messier_data
        self.bright_stars = get_bright_stars()
        self.constellation_lines = get_constellation_lines()
        self.constellation_labels = get_constellation_labels()
        
    def create_sky_chart(self, filtered_data=None, show_star_labels=True, show_constellation_lines=True, show_constellation_labels=True):
        """Create the interactive sky chart"""
        if filtered_data is None:
            filtered_data = self.messier_data
            
        fig = go.Figure()
        
        # Add constellation lines first (background)
        if show_constellation_lines:
            self._add_constellation_lines(fig)
        
        # Add bright stars as background
        self._add_bright_stars(fig, show_star_labels)
        
        # Add constellation labels
        if show_constellation_labels:
            self._add_constellation_labels(fig)
        
        # Add Messier objects by type
        self._add_messier_objects(fig, filtered_data)
        
        # Configure layout
        self._configure_layout(fig)
        
        return fig
    
    def _add_bright_stars(self, fig, show_labels=True):
        """Add bright stars as background reference"""
        text_mode = 'markers+text' if show_labels else 'markers'
        text_data = self.bright_stars['name'] if show_labels else None
        
        fig.add_trace(go.Scatter(
            x=self.bright_stars['ra'],
            y=self.bright_stars['dec'],
            mode=text_mode,
            marker=dict(
                size=4, 
                color=CHART_CONFIG['star_color'], 
                symbol='star'
            ),
            text=text_data,
            textposition='top center',
            textfont=dict(size=6, color='lightgray'),
            name='Bright Stars',
            hovertemplate='<b>%{customdata[0]}</b><br>Constellation: %{customdata[1]}<br>RA: %{x:.1f}°<br>Dec: %{y:.1f}°<br>Mag: %{customdata[2]:.1f}<extra></extra>',
            customdata=list(zip(
                self.bright_stars['name'],
                self.bright_stars['constellation'],
                self.bright_stars['magnitude']
            )),
            showlegend=False
        ))
    
    def _add_constellation_lines(self, fig):
        """Add constellation line patterns"""
        for constellation_name, constellation_data in self.constellation_lines.items():
            for line in constellation_data['lines']:
                # Each line is a list of (RA, Dec) coordinate pairs
                if len(line) >= 2:
                    ra_coords = [point[0] for point in line]
                    dec_coords = [point[1] for point in line]
                    
                    fig.add_trace(go.Scatter(
                        x=ra_coords,
                        y=dec_coords,
                        mode='lines',
                        line=dict(
                            color='rgba(128, 128, 128, 0.4)',  # Subtle gray
                            width=1
                        ),
                        name=f'{constellation_name} lines',
                        showlegend=False,
                        hoverinfo='skip'  # Don't show hover for constellation lines
                    ))
    
    def _add_constellation_labels(self, fig):
        """Add constellation name labels"""
        constellation_names = []
        ra_positions = []
        dec_positions = []
        hover_info = []
        
        for constellation_name, label_data in self.constellation_labels.items():
            constellation_names.append(constellation_name)
            ra_positions.append(label_data['position'][0])
            dec_positions.append(label_data['position'][1])
            messier_count = label_data['messier_count']
            hover_info.append(f"<b>{constellation_name}</b><br>{messier_count} Messier objects")
        
        fig.add_trace(go.Scatter(
            x=ra_positions,
            y=dec_positions,
            mode='text',
            text=constellation_names,
            textposition='middle center',
            textfont=dict(
                size=12,
                color='rgba(200, 200, 200, 0.8)',
                family='Arial Black'
            ),
            name='Constellation Labels',
            showlegend=False,
            hovertemplate='%{customdata}<extra></extra>',
            customdata=hover_info
        ))
    
    def _add_messier_objects(self, fig, filtered_data):
        """Add Messier objects grouped by type in organized order"""
        # Import here to avoid circular imports
        from config import classify_object_type
        
        # Group object types by category for organized display
        categorized_types = {}
        for obj_type in filtered_data['Object type'].unique():
            if pd.isna(obj_type):
                continue
            category = classify_object_type(obj_type)
            if category not in categorized_types:
                categorized_types[category] = []
            categorized_types[category].append(obj_type)
        
        # Process in category order: Galaxy, Nebula, Cluster, Other
        for category in ['Galaxy', 'Nebula', 'Cluster', 'Other']:
            if category not in categorized_types:
                continue
                
            # Sort object types within each category
            for obj_type in sorted(categorized_types[category]):
                type_data = filtered_data[filtered_data['Object type'] == obj_type]
                
                # Get style using the smart classification system
                if obj_type in OBJECT_STYLES:
                    style = OBJECT_STYLES[obj_type]
                else:
                    # Use the dynamic styling function for new object types
                    style = get_object_style(obj_type)
                
                fig.add_trace(go.Scatter(
                    x=type_data['ra_deg'],
                    y=type_data['dec_deg'],
                    mode='markers+text',
                    marker=dict(
                        size=style['size'],
                        color=style['color'],
                        symbol=style['symbol'],
                        line=dict(width=1, color='white')
                    ),
                    name=obj_type,
                    text=type_data['Messier number'],
                    textposition='top center',
                    textfont=dict(size=8, color=CHART_CONFIG['text_color']),
                    hovertemplate=self._get_hover_template(),
                    customdata=self._get_hover_data(type_data),
                    legendgroup=category,  # Group legend items by category
                    legendgrouptitle_text=category  # Add category headers in legend
                ))
    
    def _get_hover_template(self):
        """Get the hover template for Messier objects"""
        return ('<b>%{text}</b><br>' +
                'Name: %{customdata[0]}<br>' +
                'Type: %{customdata[1]}<br>' +
                'Constellation: %{customdata[2]}<br>' +
                'Magnitude: %{customdata[3]}<br>' +
                'Distance: %{customdata[4]} kly<br>' +
                'Best Viewing: %{customdata[5]}<br>' +
                'RA: %{x:.1f}°<br>Dec: %{y:.1f}°<extra></extra>')
    
    def _get_hover_data(self, type_data):
        """Get custom data for hover tooltips"""
        return list(zip(
            type_data['Common name'],
            type_data['Object type'],
            type_data['Constellation'],
            type_data['Apparent magnitude'],
            type_data['Distance (kly)'],
            type_data['Best Viewing']
        ))
    
    def _configure_layout(self, fig):
        """Configure the chart layout and styling"""
        fig.update_layout(
            title='Interactive Messier Sky Chart',
            xaxis_title='Right Ascension (degrees)',
            yaxis_title='Declination (degrees)',
            xaxis=dict(
                range=COORDINATE_CONFIG['ra_range'],
                dtick=COORDINATE_CONFIG['ra_tick_interval'],
                showgrid=True,
                gridcolor=CHART_CONFIG['grid_color']
            ),
            yaxis=dict(
                range=COORDINATE_CONFIG['dec_range'],
                dtick=COORDINATE_CONFIG['dec_tick_interval'],
                showgrid=True,
                gridcolor=CHART_CONFIG['grid_color']
            ),
            plot_bgcolor=CHART_CONFIG['background_color'],
            paper_bgcolor=CHART_CONFIG['paper_color'],
            font=dict(color=CHART_CONFIG['font_color']),
            legend=dict(
                yanchor="top",
                y=0.99,
                xanchor="left",
                x=1.01
            ),
            width=CHART_CONFIG['default_width'],
            height=CHART_CONFIG['default_height']
        )
    
    def get_object_count_by_type(self, filtered_data=None):
        """Get count of objects by type for statistics"""
        if filtered_data is None:
            filtered_data = self.messier_data
        return filtered_data['Object type'].value_counts().to_dict()
    
    def get_constellation_count(self, filtered_data=None):
        """Get count of objects by constellation"""
        if filtered_data is None:
            filtered_data = self.messier_data
        return filtered_data['Constellation'].value_counts().to_dict()