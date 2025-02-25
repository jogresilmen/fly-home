{
	'name' : 'Omegasoft C.A Moneda operativa en TPV',
	'version': '0.0.1',
	'category': 'Sales/Point of Sale',
	'author': 'Easy Solutions Service',
	'contributor': [
		'',
	],
	'website': 'willians.tafur@easysolutionsservices.com',
	'summary': 'Moneda Operativa TPV',
	'description': """
    Moneda Operativa TPV
	""",
    "data": [
        "views/views.xml"
    ],
    "depends": ["point_of_sale"],
    "qweb": ["static/src/xml/pos.xml"],
    'assets': {
        'point_of_sale._assets_pos': [
            'l10n_ve_pos_dual_currency/static/src/**/*',
        ],
    },
    "images": ['static/description/main_screenshot.png'],
    "live_test_url" : "",
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': True,
}
