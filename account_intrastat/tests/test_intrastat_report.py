# -*- coding: utf-8 -*-
# pylint: disable=C0326
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from freezegun import freeze_time

from odoo.addons.account_reports.tests.common import TestAccountReportsCommon
from odoo.tests import tagged
from odoo import fields, Command


@tagged('post_install', '-at_install')
class TestIntrastatReport(TestAccountReportsCommon):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create a fictional intrastat country
        country = cls.env['res.country'].create({
            'name': 'Squamuglia',
            'code': 'SQ',
            'intrastat': True,
        })
        cls.company_data['company'].country_id = country
        cls.report = cls.env.ref('account_intrastat.intrastat_report')
        cls.partner_a = cls.env['res.partner'].create({
            'name': 'Yoyodyne BE',
            'country_id': cls.env.ref('base.be').id
        })

        # A product that has no supplementary unit
        cls.product_no_supplementary_unit = cls.env['product.product'].create({
            'name': 'stamp collection',
            'intrastat_code_id': cls.env.ref('account_intrastat.commodity_code_2018_97040000').id,
            'intrastat_supplementary_unit_amount': None,
        })
        # A product that has a supplementary unit of the type "p/st"
        cls.product_unit_supplementary_unit = cls.env['product.product'].create({
            'name': 'rocket',
            'intrastat_code_id': cls.env.ref('account_intrastat.commodity_code_2018_93012000').id,
            'intrastat_supplementary_unit_amount': 1,
        })
        # A product that has a supplementary unit of the type "100 p/st"
        cls.product_100_unit_supplementary_unit = cls.env['product.product'].create({
            'name': 'Imipolex G Tooth',
            'intrastat_code_id': cls.env.ref('account_intrastat.commodity_code_2018_90212110').id,
            'intrastat_supplementary_unit_amount': 0.01,
        })
        # A product that has a supplementary unit of the type "m"
        cls.product_metre_supplementary_unit = cls.env['product.product'].create({
            'name': 'Proper Gander Film',
            'intrastat_code_id': cls.env.ref('account_intrastat.commodity_code_2018_37061020').id,
            'intrastat_supplementary_unit_amount': 1,
            'uom_id': cls.env.ref('uom.product_uom_meter').id,
            'uom_po_id': cls.env.ref('uom.product_uom_meter').id,
        })
        # A product with the product origin country set to spain
        cls.spanish_rioja = cls.env['product.product'].create({
            'name': 'rioja',
            'intrastat_code_id': cls.env.ref('account_intrastat.commodity_code_2018_22042176').id,
            'intrastat_origin_country_id': cls.env.ref('base.es').id,
        })

        code_vals = [
            {'type': type, 'name': f'{type}'}
            for type in ('commodity', 'transaction', 'region')
        ]
        cls.intrastat_codes = {}
        # 100 - commodity
        # 101 - transaction
        # 102 - region
        create_vals_list = []
        for i, vals in enumerate(code_vals, 100):
            vals['code'] = str(i)
            create_vals_list.append(vals)
        cls.intrastat_codes = {x.name: x for x in cls.env['account.intrastat.code'].sudo().create(create_vals_list)}

        cls.company_data['company'].intrastat_region_id = cls.intrastat_codes['region'].id

        cls.product_1 = cls.env['product.product'].create({
            'name': 'product_a',
            'uom_id': cls.env.ref('uom.product_uom_unit').id,
            'lst_price': 100.0,
            'standard_price': 80.0,
            'property_account_income_id': cls.company_data['default_account_revenue'].id,
            'property_account_expense_id': cls.company_data['default_account_expense'].id,
            'taxes_id': [Command.set(cls.tax_sale_a.ids)],
            'supplier_taxes_id': [Command.set(cls.tax_purchase_a.ids)],
            'intrastat_code_id': cls.intrastat_codes['commodity'].id,
            'weight': 0.3,
        })

        cls.product_2 = cls.env['product.product'].create({
            'name': 'product_2',
            'uom_id': cls.env.ref('uom.product_uom_unit').id,
            'lst_price': 150.0,
            'standard_price': 120.0,
            'property_account_income_id': cls.company_data['default_account_revenue'].id,
            'property_account_expense_id': cls.company_data['default_account_expense'].id,
            'taxes_id': [Command.set(cls.tax_sale_a.ids)],
            'supplier_taxes_id': [Command.set(cls.tax_purchase_a.ids)],
            'intrastat_code_id': cls.intrastat_codes['commodity'].id,
            'weight': 0.6,
        })

        cls.product_3 = cls.env['product.product'].create({
            'name': 'product_3',
            'uom_id': cls.env.ref('uom.product_uom_unit').id,
            'lst_price': 1000.0,
            'standard_price': 950.0,
            'property_account_income_id': cls.company_data['default_account_revenue'].id,
            'property_account_expense_id': cls.company_data['default_account_expense'].id,
            'taxes_id': [Command.set(cls.tax_sale_a.ids)],
            'supplier_taxes_id': [Command.set(cls.tax_purchase_a.ids)],
            'intrastat_code_id': cls.intrastat_codes['commodity'].id,
            'weight': 0.5,
        })

    @classmethod
    def _create_invoices(cls, code_type=None):
        moves = cls.env['account.move'].create([
            {
                'move_type': 'out_invoice',
                'partner_id': cls.partner_a.id,
                'invoice_date': '2022-01-01',
                'intrastat_country_id': cls.env.ref('base.nl').id,
                'invoice_line_ids': [
                    Command.create({
                        'name': 'line_1',
                        'product_id': cls.product_1.id,
                        'intrastat_transaction_id': cls.intrastat_codes[code_type].id if code_type else None,
                        'product_uom_id': cls.env.ref('uom.product_uom_unit').id,
                        'quantity': 1.0,
                        'account_id': cls.company_data['default_account_revenue'].id,
                        'price_unit': 80.0,
                        'tax_ids': [],
                    }),
                    Command.create({
                        'name': 'line_2',
                        'product_id': cls.product_2.id,
                        'intrastat_transaction_id': cls.intrastat_codes[code_type].id if code_type else None,
                        'product_uom_id': cls.env.ref('uom.product_uom_unit').id,
                        'quantity': 2.0,
                        'account_id': cls.company_data['default_account_revenue'].id,
                        'price_unit': 120.0,
                        'tax_ids': [],
                    }),
                ],
            },
            {
                'move_type': 'in_invoice',
                'partner_id': cls.partner_a.id,
                'invoice_date': '2022-01-01',
                'intrastat_country_id': cls.env.ref('base.nl').id,
                'invoice_line_ids': [
                    Command.create({
                        'name': 'line_3',
                        'product_id': cls.product_3.id,
                        'intrastat_transaction_id': cls.intrastat_codes[code_type].id if code_type else None,
                        'product_uom_id': cls.env.ref('uom.product_uom_unit').id,
                        'quantity': 1.0,
                        'account_id': cls.company_data['default_account_expense'].id,
                        'price_unit': 950.0,
                        'tax_ids': [],
                    }),
                ],
            },
        ])
        moves.action_post()

    @freeze_time('2022-02-01')
    def test_intrastat_report_values(self):
        self._create_invoices(code_type='transaction')
        options = self._generate_options(self.report, '2022-01-01', '2022-01-31')

        lines = self.report._get_lines(options)
        self.assertLinesValues(
            # pylint: disable=C0326
            lines,
            # 1/system, 2/country code, 3/transaction code, 4/region code,
            # 5/commodity code, 6/origin country, 10/weight, 12/value
            [       1,    2,     3,     4,     5,          6,    10,    12],
            [
                # account.move (invoice) 1
                ('19 (Dispatch)', 'Netherlands', '101', '102', '100', 'QV', '1.5',  320.0),
                # account.move (bill) 2
                ('29 (Arrival)', 'Netherlands', '101', '102', '100', 'QV', '0.5', 950.0),
            ],
            options,
        )
        # Setting the intrastat type to Arrival or Dispatch should result in a 'Total' line at the end
        options['intrastat_type'][1]['selected'] = True
        options = self._generate_options(self.report, '2022-01-01', '2022-01-31', options)
        lines = self.report._get_lines(options)
        self.assertLinesValues(
            # pylint: disable=C0326
            lines,
            # 0/name, 1/system, 12/value
            [ 0, 1 ,12],
            [
                # account.move (invoice) 1
                ('Dispatch - 101 - 100 - QV - QV999999999999 - NL - 102', '19 (Dispatch)',  320.0),
                ('Total',  '', 320),
            ],
            options,
        )

    def test_unfold_intrastat_report_lines(self):
        partner_be, partner_no_vat = self.env['res.partner'].create([
            {
                'name': 'BE Partner',
                'country_id': self.env.ref('base.be').id,
                'vat': 'BE0477472701',
            },
            {
                'name': 'FR No VAT Partner',
                'country_id': self.env.ref('base.fr').id,
                'vat': None,
            },
        ])
        moves = self.env['account.move'].create([
            {
                'move_type': 'out_invoice',
                'partner_id': partner_be.id,
                'invoice_date': '2022-01-01',
                'date': '2022-01-01',
                'intrastat_country_id': self.env.ref('base.be').id,
                'invoice_line_ids': [
                    Command.create({
                        'name': 'line_1',
                        'product_id': self.spanish_rioja.id,
                        'intrastat_transaction_id': None,
                        'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                        'quantity': 1.0,
                        'account_id': self.company_data['default_account_revenue'].id,
                        'price_unit': 80.0,
                        'tax_ids': [],
                    }),
                ],
            },
            {
                'move_type': 'out_invoice',
                'partner_id': partner_be.id,
                'invoice_date': '2022-01-02',
                'date': '2022-01-02',
                'intrastat_country_id': self.env.ref('base.be').id,
                'invoice_line_ids': [
                    Command.create({
                        'name': 'line_1',
                        'product_id': self.spanish_rioja.id,
                        'intrastat_transaction_id': None,
                        'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                        'quantity': 1.0,
                        'account_id': self.company_data['default_account_revenue'].id,
                        'price_unit': 80.0,
                        'tax_ids': [],
                    }),
                ],

            },
            {
                'move_type': 'out_invoice',
                'partner_id': partner_no_vat.id,
                'invoice_date': '2022-01-03',
                'date': '2022-01-03',
                'intrastat_country_id': self.env.ref('base.fr').id,
                'invoice_line_ids': [
                    Command.create({
                        'name': 'line_1',
                        'product_id': self.product_1.id,
                        'intrastat_transaction_id': self.intrastat_codes['transaction'].id,
                        'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                        'quantity': 1.0,
                        'account_id': self.company_data['default_account_revenue'].id,
                        'price_unit': 50.0,
                        'tax_ids': [],
                    }),
                ],

            },
        ])
        moves.action_post()

        options = self._generate_options(self.report, '2022-01-01', '2022-01-31', default_options={'unfold_all': True})
        self.assertLinesValues(
            # pylint: disable=C0326
            self.report._get_lines(options),
            # 0/name, 1/system, 2/country, 3/transaction code, 4/region code, 5/commodity code, 6/origin country, 10/weight, 12/value
            [    0,                                                           1,               2,         3,     4,     5,          6,    12],
            [
                # BE Partner with VAT
                ('Dispatch - None - 22042176 - ES - BE0477472701 - BE - 102', '19 (Dispatch)', 'Belgium',    '', '102', '22042176', 'ES', 160.0),
                ('INV/2022/00002',                                            '19 (Dispatch)', 'Belgium',  None, '102', '22042176', 'ES',  80.0),
                ('INV/2022/00001',                                            '19 (Dispatch)', 'Belgium',  None, '102', '22042176', 'ES',  80.0),
                # FR Partner without VAT
                ('Dispatch - 101 - 100 - QV - QV999999999999 - FR - 102',     '19 (Dispatch)',  'France', '101', '102',      '100', 'QV',  50.0),
                ('INV/2022/00003',                                            '19 (Dispatch)',  'France', '101', '102',      '100', 'QV',  50.0),
            ],
            options,
        )

    def test_unfold_dispatch_arrival_intrastrat_report_lines(self):
        """ This test checks that intrastat_report lines only
            contain what they have to contain.
            It means, that we should only have inbound move types
            in "Dispatch" report lines and outbound move types
            in "Arrival" report lines.
        """
        self._create_invoices('transaction')
        options = self._generate_options(self.report, '2022-01-01', '2022-01-31', default_options={'unfold_all': True})

        self.assertLinesValues(
            # pylint: disable=C0326
            self.report._get_lines(options),
            # 0/name, 1/system, 2/country code, 3/transaction code, 4/region code, 5/commodity code, 6/origin country, 10/weight, 12/value
            [    0,                                                       1,               2,             3,     4,     5,     6,    10,    12],
            [
                # account.move (invoice)
                ('Dispatch - 101 - 100 - QV - QV999999999999 - NL - 102', '19 (Dispatch)', 'Netherlands', '101', '102', '100', 'QV', '1.5', 320.0),
                ('INV/2022/00001',                                        '19 (Dispatch)', 'Netherlands', '101', '102', '100', 'QV',  0.3,  80.0),
                ('INV/2022/00001',                                        '19 (Dispatch)', 'Netherlands', '101', '102', '100', 'QV',  1.2, 240.0),
                # account.move (bill)
                ('Arrival - 101 - 100 - QV - QV999999999999 - NL - 102',  '29 (Arrival)',  'Netherlands', '101', '102', '100', 'QV', '0.5', 950.0),
                ('BILL/2022/01/0001',                                     '29 (Arrival)',  'Netherlands', '101', '102', '100', 'QV',  0.5, 950.0),
            ],
            options,
        )

    def test_no_supplementary_units(self):
        """ Test a report from an invoice with no units """
        no_supplementary_units_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.be').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.product_no_supplementary_unit.id,
                'quantity': 1,
                'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                'price_unit': 10,
                'tax_ids': [],
            })]
        })
        no_supplementary_units_invoice.action_post()

        options = self._generate_options(self.report, date_from=fields.Date.from_string('2022-05-01'), date_to=fields.Date.from_string('2022-05-31'))
        lines = self.report._get_lines(options)
        self.assertLinesValues(
            lines,
            #    Name              CommodityFlow    Country        CommodityCode  SupplementaryUnits
            #
            [    0,                1,               2,             5,             11, ],
            [
                ('Dispatch - None - 97040000 - QV - QV999999999999 - BE - 102', '19 (Dispatch)', 'Belgium',     '97040000',    '')
            ],
            options,
        )

    def test_unitary_supplementary_units(self):
        """ Test a report from an invoice with lines with units of 'unit' or 'dozens', and commodity codes with supplementary units
            that require a mapping to 'p/st' or '100 p/st' (per unit / 100 units)
        """
        unitary_supplementary_units_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.be').id,
            'invoice_line_ids': [
                # 123 (units) -> 123 (p/st)
                Command.create({
                    'product_id': self.product_unit_supplementary_unit.id,
                    'quantity': 123,
                    'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                    'price_unit': 10,
                    'tax_ids': [],
                }),
                # 20 (dozen) -> 240 (units) -> 240 (p/st)
                Command.create({
                    'product_id': self.product_unit_supplementary_unit.id,
                    'quantity': 20,
                    'product_uom_id': self.env.ref('uom.product_uom_dozen').id,
                    'price_unit': 10,
                    'tax_ids': [],
                }),
                # 123 (units) -> 1.23 (100 p/st)
                Command.create({
                    'product_id': self.product_100_unit_supplementary_unit.id,
                    'quantity': 123,
                    'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                    'price_unit': 10,
                    'tax_ids': [],
                }),
                # 20 (dozen) -> 240 (units) -> 2.4 (100 p/st)
                Command.create({
                    'product_id': self.product_100_unit_supplementary_unit.id,
                    'quantity': 20,
                    'product_uom_id': self.env.ref('uom.product_uom_dozen').id,
                    'price_unit': 10,
                    'tax_ids': [],
                }),
            ]
        })
        unitary_supplementary_units_invoice.action_post()

        options = self._generate_options(self.report, date_from=fields.Date.from_string('2022-05-01'), date_to=fields.Date.from_string('2022-05-31'))
        lines = self.report._get_lines(options)
        self.assertLinesValues(
            lines,
            #    Name              CommodityFlow    Country        CommodityCode  SupplementaryUnits
            #
            [    0,                1,               2,             5,             11,   ],
            [
                ('Dispatch - None - 90212110 - QV - QV999999999999 - BE - 102', '19 (Dispatch)', 'Belgium',     '90212110',    '3.63'),
                ('Dispatch - None - 93012000 - QV - QV999999999999 - BE - 102', '19 (Dispatch)', 'Belgium',     '93012000',    '363.00'),
            ],
            options,
        )

    def test_metres_supplementary_units(self):
        """ Test a report from an invoice with a line with units of kilometers, and a commodity code with supplementary units that
            requires a mapping to metres.
        """
        metre_supplementary_units_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.be').id,
            'invoice_line_ids': [
                # 1.23 (km) -> 1.230(m)
                Command.create({
                    'product_id': self.product_metre_supplementary_unit.id,
                    'quantity': 1.23,
                    'product_uom_id': self.env.ref('uom.product_uom_km').id,
                    'price_unit': 10,
                    'tax_ids': [],
                }),
            ]
        })
        metre_supplementary_units_invoice.action_post()

        options = self._generate_options(self.report, date_from=fields.Date.from_string('2022-05-01'), date_to=fields.Date.from_string('2022-05-31'))
        lines = self.report._get_lines(options)
        self.assertLinesValues(
            lines,
            #    Name              CommodityFlow    Country        CommodityCode  SupplementaryUnits
            #
            [    0,                1,               2,             5,             11, ],
            [
                ('Dispatch - None - 37061020 - QV - QV999999999999 - BE - 102', '19 (Dispatch)', 'Belgium',     '37061020',     '1230.00'),
            ],
            options,
        )

    def test_xlsx_output(self):
        """ XSLX output should be slightly different to the values in the UI. The UI should be readable, and the XLSX should be closer to the declaration format.
            Rather than patching the print_xlsx function, this test compares the results of the report when the options contain the keys that signify the content
            is exported with codes rather than full names.
            In XSLX:
                The 2-digit ISO country codes should be used instead of the full name of the country.
                Only the 'system' number should be used, instead of the 'system' and 'type' (e.g. '7' instead of 7 (Dispatch)' as it appears in the UI).
        """
        # To test the range of differences, we create one invoice with an intrastat country being Belgium, and one bill with an intrastat country being the Netherlands.
        # the product we use should have a product origin country of Spain, which should have the country code in the report too.
        belgian_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.be').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.spanish_rioja.product_variant_ids.id,
                'quantity': 1,
                'price_unit': 20,
                'tax_ids': [],
            })]
        })
        dutch_bill = self.env['account.move'].create({
            'move_type': 'in_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.nl').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.spanish_rioja.product_variant_ids.id,
                'quantity': 2,
                'price_unit': 20,
                'tax_ids': [],
            })]
        })
        belgian_invoice.action_post()
        dutch_bill.action_post()
        options = self._generate_options(self.report, '2022-05-01', '2022-05-31', default_options={'country_format': 'code', 'commodity_flow': 'code'})

        lines = self.report._get_lines(options)
        self.assertLinesValues(
            lines,
            #    Name                 CommodityFlow  Country  CommodityCode  OriginCountry
            #
            [    0,                            1,   2,       5,             6],
            [
                ('Dispatch - None - 22042176 - ES - QV999999999999 - BE - 102',    '19',          'BE',    '22042176',    'ES'),
                ('Arrival - None - 22042176 - ES - QV999999999999 - NL - 102',    '29',          'NL',    '22042176',    'ES'),
            ],
            options,
        )

    def test_xi_invoice_with_xu_product(self):
        """ Test a report from an invoice made for Northern Ireland with a product from United Kingdom.
        """
        self.product_no_supplementary_unit.product_tmpl_id.intrastat_origin_country_id = self.env.ref('base.uk').id
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2024-01-10',
            'date': '2024-01-10',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('account_intrastat.xi').id,
            'invoice_line_ids': [
                Command.create({
                    'product_id': self.product_no_supplementary_unit.id,
                    'quantity': 1,
                    'product_uom_id': self.env.ref('uom.product_uom_unit').id,
                    'price_unit': 10,
                }),
            ]
        })
        invoice.action_post()
        options = self._generate_options(self.report, '2024-01-01', '2024-01-31', default_options={'country_format': 'code'})
        lines = self.report._get_lines(options)
        self.assertLinesValues(
            lines,
            #    Name                CommodityFlow      Country   OriginCountry
            #
            [    0,                  1,                 2,        6   ],
            [
                ('Dispatch - None - 97040000 - XU - QV999999999999 - XI - 102',   '19 (Dispatch)',   'XI',     'XU'),
            ],
            options
        )

    def test_dynamic_line_generator_aggregate(self):
        """
        Test the report to see if the lines are correctly aggregated (the top foldable lines).
        Each lines is an aggregation based on the country, the currency and the commodity code which form the name of the line (in that order)
        The lines should contain the name in the correct format, the country code and the commodity code.
        Format of the name : 'Country Code - Currency - Commodity Code'
        The  country code is a 2-digit ISO code and the currency a 3-digit ISO currency one.
        """
        belgian_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.be').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.spanish_rioja.product_variant_ids.id,
                'quantity': 1,
                'price_unit': 20,
                'tax_ids': [],
            })]
        })
        dutch_bill = self.env['account.move'].create({
            'move_type': 'in_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.nl').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.spanish_rioja.product_variant_ids.id,
                'quantity': 2,
                'price_unit': 20,
                'tax_ids': [],
            })]
        })
        belgian_invoice.action_post()
        dutch_bill.action_post()
        options = self._generate_options(self.report, '2022-05-01', '2022-05-31', default_options={'country_format': 'code', 'commodity_flow': 'code'})

        self.assertLinesValues(
            self.report._get_lines(options),
            #    Name                   Country  CommodityCode
            #
            [    0,                     2,       5        ],
            [
                ('Dispatch - None - 22042176 - ES - QV999999999999 - BE - 102', 'BE',    '22042176'),
                ('Arrival - None - 22042176 - ES - QV999999999999 - NL - 102', 'NL',    '22042176'),
            ],
            options,
        )

    def test_dynamic_line_generator_aggregate_intrastat_type(self):
        """
        Test the report to see if the lines aggregated lines are correctly displayed when only one type of move is selected ('Arrival' or 'Dispatch')
        When one of them is selected the system column as well as the value one should be populate.
        The 'system' should contain the string of the selected type and 'value' should contain the sum of all aggregated move for the specific country, currency and commodity code.
        """
        belgian_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.be').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.spanish_rioja.product_variant_ids.id,
                'quantity': 1,
                'price_unit': 20,
                'tax_ids': [],
            })]
        })
        dutch_bill = self.env['account.move'].create({
            'move_type': 'in_invoice',
            'partner_id': self.partner_a.id,
            'invoice_date': '2022-05-15',
            'date': '2022-05-15',
            'company_id': self.company_data['company'].id,
            'intrastat_country_id': self.env.ref('base.nl').id,
            'invoice_line_ids': [Command.create({
                'product_id': self.spanish_rioja.product_variant_ids.id,
                'quantity': 2,
                'price_unit': 20,
                'tax_ids': [],
            })]
        })
        belgian_invoice.action_post()
        dutch_bill.action_post()
        # We only select 'Dispatch'
        default_type = [
            {'name': ('Arrival'), 'selected': False, 'id': 'arrival'},
            {'name': ('Dispatch'), 'selected': True, 'id': 'dispatch'},
        ]
        default_options = {
            'country_format': 'code',
            'commodity_flow': 'code',
            'intrastat_type': default_type,
        }
        options = self._generate_options(self.report, '2022-05-01', '2022-05-31', default_options=default_options)

        self.assertLinesValues(
            self.report._get_lines(options),
            #    Name                   System      Country  CommodityCode  Value
            #
            [    0,                     1,          2,       5,             12],
            [
                ('Dispatch - None - 22042176 - ES - QV999999999999 - BE - 102', '19', 'BE',    '22042176',    20),
                ('Total'              ,       '', '',          '',    20),
            ],
            options,
        )
