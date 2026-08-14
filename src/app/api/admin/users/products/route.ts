import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, productName } = body;

    if (!userId || !productName) {
      return NextResponse.json({ error: "Missing required fields (userId, productName)." }, { status: 400 });
    }

    // Attempt to update users table array directly
    // Assuming pro_products is a string[] column
    const { rows } = await pool.query("SELECT pro_products FROM users WHERE id = $1", [userId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentProducts = rows[0].pro_products || [];
    
    // Add product if it doesn't already exist
    if (!currentProducts.includes(productName)) {
      currentProducts.push(productName);
      await pool.query("UPDATE users SET pro_products = $1 WHERE id = $2", [currentProducts, userId]);
    }

    return NextResponse.json({ success: true, message: "Product assigned successfully.", pro_products: currentProducts });
  } catch (error) {
    console.error("Assign product error:", error);
    return NextResponse.json({ error: "Failed to assign product" }, { status: 500 });
  }
}
