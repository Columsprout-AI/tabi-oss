import * as XLSX from "xlsx";

export const convertXlsxToCsv = async (xlsxFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Convert first sheet to CSV
        const csv = XLSX.utils.sheet_to_csv(
          workbook.Sheets[workbook.SheetNames[0]]
        );

        // Create a new CSV file from the converted data
        const csvBlob = new Blob([csv], { type: "text/csv" });
        const csvFile = new File(
          [csvBlob],
          xlsxFile.name.replace(".xlsx", ".csv"),
          {
            type: "text/csv",
          }
        );

        resolve(csvFile);
      } catch (error) {
        console.error("Error converting XLSX to CSV:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(xlsxFile);
  });
};
