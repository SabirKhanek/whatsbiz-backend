import pandas as pd
import openpyxl as xl
from openpyxl.worksheet.table import Table, TableStyleInfo
import shutil
import sys


def add_pivot_excel(xl_file):
    try:
        try:
            # Load the Excel file into a pandas DataFrame
            df = pd.read_excel(xl_file, sheet_name='Products')
        except Exception as e:
            print(e)
            raise ValueError('Error: Excel file not found or invalid format')

        try:
            # Copy the pivot table template file
            shutil.copyfile('pivot_template.xlsx', xl_file)
        except Exception as e:
            raise ValueError('Error: Pivot table template file not found')

        # Load the Excel file into an openpyxl workbook object
        wb = xl.load_workbook(xl_file)

        # Select the worksheet to insert data into
        ws = wb['Products']

        # Load data from the pandas DataFrame into the worksheet
        for row in df.values:
            ws.append(row.tolist())

        tab = Table(displayName="Table1", ref="A1:P"+str(len(df)+1))

        # Add a default style with striped rows and banded columns
        style = TableStyleInfo(name="TableStyleMedium9", showFirstColumn=False,
                               showLastColumn=False, showRowStripes=True, showColumnStripes=True)
        tab.tableStyleInfo = style

        ws.add_table(tab)

        # Save the workbook
        wb.save(xl_file)
        print('success')
    except Exception as e:
        print(str(e))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python pivot.py <excel_file>')
    add_pivot_excel(sys.argv[1])
