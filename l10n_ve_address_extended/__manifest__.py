{
    'name': 'Address Extended - Venezuela',
    'summary': """
    This module extends address to manage the geopolitical structure of Venezuela (States, Municipalities, Parishes, and Cities).
    """,
    'category': 'Technical',
    'license': 'LGPL-3',
    'author': 'Tecnodomotik',
    'maintainer': 'tecnodomotik@gmail.com',
    'support': 'tecnodomotik@gmail.com',
    'website': 'https://tecnodomotik.odoo.com',
    "version": "17.0.1.0.1",
    'depends': ['base', 'contacts', 'base_address_extended'],
    'images': ['static/description/images/address_extended_ve.png'],
    'data': [
        'security/ir.model.access.csv',
        'data/res_country_state_data.xml',
        'data/res.city.csv',
        'data/res.municipality.csv',
        'data/res.parish.csv',
        'views/res_municipality_views.xml',
        'views/res_parish_views.xml',
        'views/base_address_extended_views.xml',
    ], 
    'installable': True,
    'auto_install': False,
}