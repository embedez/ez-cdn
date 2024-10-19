import axios from "axios";

export async function handleInputFile(input: File | string): Promise<File> {
  if (typeof input === "string") {
    const response = await axios.get(input, { responseType: "arraybuffer" });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers["content-disposition"] || "";
    const match = contentDisposition.match(/filename="?(.+)"?\b/);
    const filename = match && match[1] ? match[1] : "unknown_file";

    return new File([new Blob([response.data])], filename);
  } else {
    return input;
  }
}

export async function handleInputFiles(
  input: (File | string)[],
): Promise<File[]> {
  const promises: Promise<File>[] = input.map((item) => {
    if (typeof item === "string") {
      return axios
        .get(item, { responseType: "arraybuffer" })
        .then((response) => {
          // Extract filename from Content-Disposition header
          const contentDisposition =
            response.headers["content-disposition"] || "";
          const match = contentDisposition.match(/filename="?(.+)"?\b/);
          const filename = match && match[1] ? match[1] : "unknown_file";
          return new File([new Blob([response.data])], filename);
        });
    } else {
      return Promise.resolve(item);
    }
  });

  return Promise.all(promises);
}
