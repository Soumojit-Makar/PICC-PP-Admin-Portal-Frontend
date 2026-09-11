import {
    forwardRef,
    useImperativeHandle,
    useState,
} from "react";
import {
    DataGrid,
    type GridColDef,
    type GridRowId,
    type GridRowSelectionModel,
    GridToolbarContainer,
    GridToolbarQuickFilter,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
} from "@mui/x-data-grid";

type NNPGridProps = {
    columns: GridColDef[];
    rows: any[];
    loading?: boolean;
    isColumselectionDisabled?: boolean;
    showCheckbox?: boolean;
    onSelectionChange?: (selectedRows: any[]) => void;
    getRowId?: (row: any) => GridRowId;
    tick?: number;
    enableSearch?: boolean; // New optional prop to enable search options, defaults to true
    rowHeight?: number; // Optional custom row height, defaults to 44
    paginationMode?: "client" | "server";
    rowCount?: number;
    paginationModel?: { page: number; pageSize: number };
    onPaginationModelChange?: (model: { page: number; pageSize: number }) => void;
};

export type NNPGridRef = {
    getSelectedRows: () => any[];
};

// Custom Toolbar with columns selectors, filters, density, and global quick search
const CustomToolbar = () => {
    return (
        <GridToolbarContainer className="flex flex-wrap justify-between items-center gap-4 p-2 bg-transparent">
            <div className="flex gap-1">
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
            </div>
            <GridToolbarQuickFilter
                slotProps={{
                    root: {
                        placeholder: "Search columns...",
                        size: "small",
                    }
                }}
            />
        </GridToolbarContainer>
    );
};

const NNPGrid = forwardRef<NNPGridRef, NNPGridProps>(
    (
        {
            columns,
            rows,
            loading = false,
            isColumselectionDisabled = false,
            showCheckbox = false,
            onSelectionChange,
            getRowId,
            tick,
            enableSearch = true, // Default to true so all configuration tables have search
            rowHeight = 44,
            paginationMode = "client",
            rowCount,
            paginationModel,
            onPaginationModelChange,
        },
        ref
    ) => {
        void tick; // To trigger re-render on tick change
        const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
            type: 'include',
            ids: new Set(),
        });

        // ✅ Helper: filter rows based on selected IDs (supports Array or Object GridRowSelectionModel)
        const formatRowId = (rowSelection: GridRowSelectionModel) => {
            let selectedIds: GridRowId[] = [];
            if (Array.isArray(rowSelection)) {
                selectedIds = rowSelection as GridRowId[];
            } else if (rowSelection && typeof rowSelection === 'object' && 'ids' in rowSelection) {
                selectedIds = Array.from((rowSelection as any).ids ?? []);
            }
            const selected = rows.filter((row) => {
                const rowKey = getRowId ? getRowId(row) : row.id;
                return selectedIds.includes(rowKey as GridRowId);
            });
            return selected;
        };

        // ✅ Expose selected rows to parent
        useImperativeHandle(ref, () => ({
            getSelectedRows: () => formatRowId(rowSelectionModel),
        }));

        return (
            <div style={{ height: "100%", width: "100%" }} className="body-font">
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    checkboxSelection={showCheckbox}
                    disableRowSelectionOnClick={isColumselectionDisabled}
                    rowHeight={rowHeight}
                    columnHeaderHeight={40} 
                    pageSizeOptions={[5, 10, 20]}
                    paginationMode={paginationMode}
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={onPaginationModelChange}
                    getRowClassName={(params) =>
                        params.indexRelativeToCurrentPage % 2 === 0
                            ? 'even-row'
                            : 'odd-row'
                    }
                    slots={{
                        toolbar: enableSearch ? CustomToolbar : undefined
                    }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 250 }
                        }
                    }}
                    sx={{
                        fontSize: 'var(--font-size-sm)',
                        '& .even-row': {
                            backgroundColor: 'var(--grid-even-row-color)', // light gray or white
                        },
                        '& .odd-row': {
                            backgroundColor: 'var(--grid-odd-row-color)',
                        },
                        "& .MuiDataGrid-columnHeader": {
                            backgroundColor: "var(--grid-header-color) !important",
                            color: "var(--grid-header-text-color)",
                        },
                        // Style the toolbar to match table themes
                        "& .MuiDataGrid-toolbarContainer": {
                            padding: "6px 12px",
                            backgroundColor: "var(--grid-header-color, rgba(0, 0, 0, 0.03))",
                            borderBottom: "1px solid var(--grid-border-color, rgba(224, 224, 224, 0.3))",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                        },
                        "& .MuiButton-root": {
                            color: "var(--grid-header-text-color, #5c8edb) !important",
                            fontSize: "12px",
                            textTransform: "none",
                        },
                        "& .MuiDataGrid-toolbarContainer .MuiTextField-root": {
                            margin: 0,
                            minWidth: "180px",
                        },
                        "& .MuiDataGrid-toolbarContainer .MuiInputBase-root": {
                            borderRadius: '6px',
                            height: '30px',
                            fontSize: '12px',
                        },
                    }}
                    getRowId={(row) => getRowId ? getRowId(row) : row.id} // Use the provided getRowId prop
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    onRowSelectionModelChange={(newModel) => {
                        setRowSelectionModel(newModel);
                        const selectedRows = formatRowId(newModel);
                        onSelectionChange?.(selectedRows);
                    }}
                    rowSelectionModel={rowSelectionModel}
                />
            </div>
        );
    }
);

export default NNPGrid;
