# main.py
"""Main application for the Interactive Messier Sky Chart"""

import dash
from dash import dcc, html, Input, Output, State, callback
import dash_bootstrap_components as dbc
from data_utils import load_messier_data, process_coordinates, get_filter_options, filter_data
from chart_generator import MessierSkyChart
import argparse
import sys
import os


def create_app(csv_path=None):
    """Create and configure the Dash app"""
    
    # Initialize app
    app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
    
    # Load and process data
    print("Loading Messier data...")
    messier_data = load_messier_data(csv_path)
    messier_data = process_coordinates(messier_data)
    
    # Initialize chart
    chart = MessierSkyChart(messier_data)
    
    # Get filter options
    filter_options = get_filter_options(messier_data)
    
    # Define app layout
    app.layout = create_layout(filter_options)
    
    # Define callbacks
    @app.callback(
        Output("sky-chart", "figure"),
        [Input("object-type-filter", "value"),
         Input("constellation-filter", "value"),
         Input("season-filter", "value"),
         Input("star-labels-toggle", "value"),
         Input("constellation-lines-toggle", "value"),
         Input("constellation-labels-toggle", "value")]
    )
    def update_chart(selected_types, selected_constellations, selected_seasons, 
                    show_star_labels, show_constellation_lines, show_constellation_labels):
        """Update chart based on filter selections"""
        filtered_data = filter_data(
            messier_data, 
            selected_types, 
            selected_constellations, 
            selected_seasons
        )
        
        # Convert checkbox values to booleans
        show_stars = len(show_star_labels) > 0
        show_lines = len(show_constellation_lines) > 0
        show_labels = len(show_constellation_labels) > 0
        
        return chart.create_sky_chart(filtered_data, show_stars, show_lines, show_labels)
    
    @app.callback(
        Output("object-count", "children"),
        [Input("object-type-filter", "value"),
         Input("constellation-filter", "value"),
         Input("season-filter", "value")]
    )
    def update_object_count(selected_types, selected_constellations, selected_seasons):
        """Update object count display"""
        filtered_data = filter_data(
            messier_data, 
            selected_types, 
            selected_constellations, 
            selected_seasons
        )
        return f"Showing {len(filtered_data)} of {len(messier_data)} objects"
    
    # Collapse/Expand callbacks
    @app.callback(
        [Output("object-type-collapse", "is_open"),
         Output("object-type-icon", "children")],
        Input("object-type-collapse-button", "n_clicks"),
        State("object-type-collapse", "is_open"),
        prevent_initial_call=True
    )
    def toggle_object_type_collapse(n_clicks, is_open):
        if n_clicks:
            new_state = not is_open
            icon_text = "▼ " if new_state else "▶ "
            return new_state, icon_text
        return is_open, "▶ "
    
    @app.callback(
        [Output("constellation-collapse", "is_open"),
         Output("constellation-icon", "children")],
        Input("constellation-collapse-button", "n_clicks"),
        State("constellation-collapse", "is_open"),
        prevent_initial_call=True
    )
    def toggle_constellation_collapse(n_clicks, is_open):
        if n_clicks:
            new_state = not is_open
            icon_text = "▼ " if new_state else "▶ "
            return new_state, icon_text
        return is_open, "▶ "
    
    @app.callback(
        [Output("season-collapse", "is_open"),
         Output("season-icon", "children")],
        Input("season-collapse-button", "n_clicks"),
        State("season-collapse", "is_open"),
        prevent_initial_call=True
    )
    def toggle_season_collapse(n_clicks, is_open):
        if n_clicks:
            new_state = not is_open
            icon_text = "▼ " if new_state else "▶ "
            return new_state, icon_text
        return is_open, "▶ "
    
    # Expand/Collapse All buttons
    @app.callback(
        [Output("object-type-collapse", "is_open", allow_duplicate=True),
         Output("constellation-collapse", "is_open", allow_duplicate=True),
         Output("season-collapse", "is_open", allow_duplicate=True),
         Output("object-type-icon", "children", allow_duplicate=True),
         Output("constellation-icon", "children", allow_duplicate=True),
         Output("season-icon", "children", allow_duplicate=True)],
        [Input("expand-all-filters", "n_clicks"),
         Input("collapse-all-filters", "n_clicks")],
        prevent_initial_call=True
    )
    def toggle_all_filters(expand_clicks, collapse_clicks):
        ctx = dash.callback_context
        if not ctx.triggered:
            return dash.no_update
            
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
        
        if button_id == "expand-all-filters":
            icon_text = "▼ "
            return True, True, True, icon_text, icon_text, icon_text
        elif button_id == "collapse-all-filters":
            icon_text = "▶ "
            return False, False, False, icon_text, icon_text, icon_text
        
        return dash.no_update
    
    # Update badges when selections change
    @app.callback(
        Output("object-type-badge", "children"),
        Input("object-type-filter", "value")
    )
    def update_object_type_badge(selected_types):
        return f"{len(selected_types)} selected"
    
    @app.callback(
        Output("constellation-badge", "children"),
        Input("constellation-filter", "value")
    )
    def update_constellation_badge(selected_constellations):
        return f"{len(selected_constellations)} selected"
    
    @app.callback(
        Output("season-badge", "children"),
        Input("season-filter", "value")
    )
    def update_season_badge(selected_seasons):
        return f"{len(selected_seasons)} selected"
    
    @app.callback(
        Output("object-type-filter", "value"),
        [Input("select-all-types", "n_clicks"),
         Input("deselect-all-types", "n_clicks")],
        prevent_initial_call=True
    )
    def toggle_all_object_types(select_clicks, deselect_clicks):
        ctx = dash.callback_context
        if not ctx.triggered:
            return filter_options['object_types']
        
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
        if button_id == "select-all-types":
            return filter_options['object_types']
        elif button_id == "deselect-all-types":
            return []
        return filter_options['object_types']
    
    @app.callback(
        Output("constellation-filter", "value"),
        [Input("select-all-constellations", "n_clicks"),
         Input("deselect-all-constellations", "n_clicks")],
        prevent_initial_call=True
    )
    def toggle_all_constellations(select_clicks, deselect_clicks):
        ctx = dash.callback_context
        if not ctx.triggered:
            return filter_options['constellations']
        
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
        if button_id == "select-all-constellations":
            return filter_options['constellations']
        elif button_id == "deselect-all-constellations":
            return []
        return filter_options['constellations']
    
    @app.callback(
        Output("season-filter", "value"),
        [Input("select-all-seasons", "n_clicks"),
         Input("deselect-all-seasons", "n_clicks")],
        prevent_initial_call=True
    )
    def toggle_all_seasons(select_clicks, deselect_clicks):
        ctx = dash.callback_context
        if not ctx.triggered:
            return filter_options['seasons']
        
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
        if button_id == "select-all-seasons":
            return filter_options['seasons']
        elif button_id == "deselect-all-seasons":
            return []
        return filter_options['seasons']
    
    return app


def create_layout(filter_options):
    """Create the app layout"""
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H1("Interactive Messier Sky Chart", 
                       className="text-center mb-4",
                       style={"font-family": "Georgia, 'Times New Roman', Times, serif"}),
                html.Hr(),
                
                # Compact filter controls row
                dbc.Row([
                    dbc.Col([
                        dbc.ButtonGroup([
                            dbc.Button("Expand All Filters", id="expand-all-filters", size="sm", color="info", outline=True),
                            dbc.Button("Collapse All Filters", id="collapse-all-filters", size="sm", color="secondary", outline=True)
                        ], className="mb-3")
                    ], width=4),
                    dbc.Col([
                        html.Div([
                            dbc.Checklist(
                                id="star-labels-toggle",
                                options=[{"label": "Show star labels", "value": "show"}],
                                value=["show"],
                                inline=True,
                                className="mb-2",
                                style={"font-family": "Arial, Helvetica, sans-serif"}
                            ),
                            dbc.Checklist(
                                id="constellation-lines-toggle",
                                options=[{"label": "Show constellation lines", "value": "show"}],
                                value=["show"],
                                inline=True,
                                className="mb-2",
                                style={"font-family": "Arial, Helvetica, sans-serif"}
                            ),
                            dbc.Checklist(
                                id="constellation-labels-toggle",
                                options=[{"label": "Show constellation names", "value": "show"}],
                                value=["show"],
                                inline=True,
                                style={"font-family": "Arial, Helvetica, sans-serif"}
                            )
                        ])
                    ], width=8)
                ]),
                
                # Collapsible Filters section
                dbc.Row([
                    dbc.Col([
                        # Object Types Filter
                        dbc.Card([
                            dbc.CardHeader([
                                dbc.Button(
                                    [
                                        html.Span("▼ ", id="object-type-icon", 
                                                style={"font-family": "Arial, Helvetica, sans-serif"}),
                                        html.Span("Object Types", className="fw-bold",
                                                style={"font-family": "Arial, Helvetica, sans-serif"}),
                                        dbc.Badge(f"{len(filter_options['object_types'])} selected", 
                                                id="object-type-badge", color="primary", className="ms-2")
                                    ],
                                    id="object-type-collapse-button",
                                    color="link",
                                    className="text-start w-100 text-decoration-none",
                                    style={"border": "none", "padding": "0.5rem", 
                                          "font-family": "Arial, Helvetica, sans-serif"}
                                )
                            ], style={"padding": "0"}),
                            dbc.Collapse([
                                dbc.CardBody([
                                    dbc.ButtonGroup([
                                        dbc.Button("Select All", id="select-all-types", size="sm", color="primary", outline=True),
                                        dbc.Button("Deselect All", id="deselect-all-types", size="sm", color="secondary", outline=True)
                                    ], className="mb-2"),
                                    dbc.Checklist(
                                        id="object-type-filter",
                                        options=[{"label": obj_type, "value": obj_type} 
                                                for obj_type in filter_options['object_types']],
                                        value=filter_options['object_types'],
                                        inline=False,
                                        style={"font-family": "Arial, Helvetica, sans-serif"}
                                    )
                                ])
                            ], id="object-type-collapse", is_open=False)
                        ], className="mb-3")
                    ], width=4),
                    
                    dbc.Col([
                        # Constellations Filter
                        dbc.Card([
                            dbc.CardHeader([
                                dbc.Button(
                                    [
                                        html.Span("▶ ", id="constellation-icon",
                                                style={"font-family": "Arial, Helvetica, sans-serif"}),
                                        html.Span("Constellations", className="fw-bold",
                                                style={"font-family": "Arial, Helvetica, sans-serif"}),
                                        dbc.Badge(f"{len(filter_options['constellations'])} selected", 
                                                id="constellation-badge", color="primary", className="ms-2")
                                    ],
                                    id="constellation-collapse-button",
                                    color="link",
                                    className="text-start w-100 text-decoration-none",
                                    style={"border": "none", "padding": "0.5rem",
                                          "font-family": "Arial, Helvetica, sans-serif"}
                                )
                            ], style={"padding": "0"}),
                            dbc.Collapse([
                                dbc.CardBody([
                                    dbc.ButtonGroup([
                                        dbc.Button("Select All", id="select-all-constellations", size="sm", color="primary", outline=True),
                                        dbc.Button("Deselect All", id="deselect-all-constellations", size="sm", color="secondary", outline=True)
                                    ], className="mb-2"),
                                    dbc.Checklist(
                                        id="constellation-filter",
                                        options=[{"label": const, "value": const} 
                                                for const in filter_options['constellations']],
                                        value=filter_options['constellations'],
                                        inline=False,
                                        style={"font-family": "Arial, Helvetica, sans-serif"}
                                    )
                                ])
                            ], id="constellation-collapse", is_open=False)
                        ], className="mb-3")
                    ], width=4),
                    
                    dbc.Col([
                        # Seasons Filter
                        dbc.Card([
                            dbc.CardHeader([
                                dbc.Button(
                                    [
                                        html.Span("▶ ", id="season-icon",
                                                style={"font-family": "Arial, Helvetica, sans-serif"}),
                                        html.Span("Best Viewing Season", className="fw-bold",
                                                style={"font-family": "Arial, Helvetica, sans-serif"}),
                                        dbc.Badge(f"{len(filter_options['seasons'])} selected", 
                                                id="season-badge", color="primary", className="ms-2")
                                    ],
                                    id="season-collapse-button",
                                    color="link",
                                    className="text-start w-100 text-decoration-none",
                                    style={"border": "none", "padding": "0.5rem",
                                          "font-family": "Arial, Helvetica, sans-serif"}
                                )
                            ], style={"padding": "0"}),
                            dbc.Collapse([
                                dbc.CardBody([
                                    dbc.ButtonGroup([
                                        dbc.Button("Select All", id="select-all-seasons", size="sm", color="primary", outline=True),
                                        dbc.Button("Deselect All", id="deselect-all-seasons", size="sm", color="secondary", outline=True)
                                    ], className="mb-2"),
                                    dbc.Checklist(
                                        id="season-filter",
                                        options=[{"label": season, "value": season} 
                                                for season in filter_options['seasons']],
                                        value=filter_options['seasons'],
                                        inline=False,
                                        style={"font-family": "Arial, Helvetica, sans-serif"}
                                    )
                                ])
                            ], id="season-collapse", is_open=False)
                        ], className="mb-3")
                    ], width=4),
                ]),
                
                # Object count display
                dbc.Row([
                    dbc.Col([
                        dbc.Alert(
                            id="object-count",
                            color="info",
                            className="text-center mb-3",
                            style={"font-family": "Arial, Helvetica, sans-serif"}
                        )
                    ])
                ]),
                
                # Chart
                dbc.Row([
                    dbc.Col([
                        dcc.Graph(id="sky-chart", style={"height": "800px"})
                    ])
                ])
                
            ], width=12)
        ])
    ], fluid=True)


def print_usage_instructions():
    """Print usage instructions"""
    print("="*60)
    print("MESSIER SKY CHART SETUP INSTRUCTIONS")
    print("="*60)
    print("\n1. Install required packages:")
    print("   pip install -r requirements.txt")
    print("\n2. The app will automatically look for 'Messier_data.csv' in the current directory")
    print("   This provides the complete, reliable 110-object Messier catalog")
    print("\n3. Or run with sample data if no CSV is found:")
    print("   python main.py")
    print("\n4. Open the URL shown in terminal (usually http://127.0.0.1:8050)")
    print("\n5. Use the checkboxes to filter by object type, constellation, or season")
    print("\nFile Structure:")
    print("- main.py: Main application")
    print("- data_utils.py: Data processing functions")
    print("- chart_generator.py: Chart creation logic")
    print("- config.py: Configuration and styling")
    print("="*60)


if __name__ == "__main__":
    import os
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Interactive Messier Sky Chart')
    parser.add_argument('--csv', help='Path to CSV file with Messier data')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    parser.add_argument('--port', type=int, default=8050, help='Port to run on')
    parser.add_argument('--host', default='127.0.0.1', help='Host to run on')
    
    args = parser.parse_args()
    
    # Deployment-friendly settings
    port = int(os.environ.get('PORT', args.port))
    host = os.environ.get('HOST', '0.0.0.0' if os.environ.get('PORT') else args.host)
    debug = args.debug and not os.environ.get('PORT')  # Never debug in production
    
    # Print instructions (will show in Render logs)
    if not os.environ.get('PORT'):
        print_usage_instructions()
    
    # Create and run app
    try:
        app = create_app(args.csv)
        print(f"\nStarting server on {host}:{port}")
        app.run(debug=debug, host=host, port=port)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


# Spyder-friendly execution
# Uncomment and run this section if running directly in Spyder console
"""
# For Spyder development - run this in console:
if 'app' not in globals():
    app = create_app()  # or create_app('your_messier_data.csv')
    print("App created! Run: app.run(debug=True, use_reloader=False)")

# Then run this to start the server:
# app.run(debug=True, use_reloader=False, port=8050)
"""