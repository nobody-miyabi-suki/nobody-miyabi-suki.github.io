from PIL import Image
from pathlib import Path

input_dir=Path(".")
output_dir=input_dir/"compressed"

formats={".jpg",".jpeg",".png",".webp",".bmp",".tiff",".tif"}

output_dir.mkdir(exist_ok=True)

for file in input_dir.rglob("*"):
    if not file.is_file():
        continue

    if output_dir in file.parents:
        continue

    if file.suffix.lower() not in formats:
        continue

    try:
        img=Image.open(file)

        if img.mode in ("RGBA","LA"):
            output_img=img
        else:
            output_img=img.convert("RGB")

        relative=file.relative_to(input_dir)
        output=output_dir/relative.with_suffix(".webp")

        output.parent.mkdir(parents=True,exist_ok=True)

        output_img.save(
            output,
            "WEBP",
            quality=75,
            method=6
        )

        old_size=file.stat().st_size/1024
        new_size=output.stat().st_size/1024
        percent=(1-new_size/old_size)*100

        print(
            f"{file.name}: "
            f"{old_size:.1f} KB -> "
            f"{new_size:.1f} KB "
            f"({percent:.1f}% smaller)"
        )

    except Exception as e:
        print(f"ERROR: {file} -> {e}")

print("\nDone!")