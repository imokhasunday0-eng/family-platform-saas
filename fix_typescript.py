from pathlib import Path
import shutil

ROOT = Path(".")

# ---------------------------------------------------------
# 1. Fix meal-planner null recipe
# ---------------------------------------------------------

meal_file = ROOT / "app/(dashboard)/meal-planner/page.tsx"
meal_backup = meal_file.with_suffix(meal_file.suffix + ".backup")

shutil.copy2(meal_file, meal_backup)

text = meal_file.read_text()

old = """name: m.recipe.title,"""
new = """name: m.recipe?.title ?? "Unnamed meal","""

if old not in text:
    print("WARNING: Could not find the meal-planner line.")
else:
    text = text.replace(old, new, 1)
    meal_file.write_text(text)
    print("Fixed meal-planner recipe null handling.")


# ---------------------------------------------------------
# 2. Fix invitation route
# ---------------------------------------------------------

join_file = ROOT / "app/api/join/route.ts"
join_backup = join_file.with_suffix(join_file.suffix + ".backup")

shutil.copy2(join_file, join_backup)

text = join_file.read_text()

# Add validation immediately after the function begins,
# if the route contains the expected request/token pattern.
old = """  const invite = await prisma.invitation.findUnique({
    where: { token },"""

new = """  if (!token) {
    return NextResponse.json(
      { error: "Invitation token is required" },
      { status: 400 }
    );
  }

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { family: true },"""

if old not in text:
    print("WARNING: Could not find the expected invitation query.")
else:
    text = text.replace(old, new, 1)
    join_file.write_text(text)
    print("Fixed invitation token validation and family relation.")


print()
print("Backups created:")
print(meal_backup)
print(join_backup)
print()
print("Now run:")
print("npx tsc --noEmit")
