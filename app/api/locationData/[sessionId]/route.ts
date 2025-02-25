import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../../utils";
import { LocationDataInterface, LocationDataType } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const { activities = [], accommodations = [] } = await request.json();

    // Helper function to create full LocationData objects
    const createLocationData = (
      items: Partial<LocationDataInterface>[],
      type: LocationDataType
    ): LocationDataInterface[] => {
      return items.map((item) => ({
        locationDataId: uuidv4(),
        locationId: item.locationId || "",
        sessionId,
        name: item.name || "",
        url: item.url || "",
        type,
        createdAt: new Date().toISOString(),
      }));
    };

    // Create full LocationData objects for each type
    const locationData = [
      ...createLocationData(activities, LocationDataType.ACTIVITY),
      ...createLocationData(accommodations, LocationDataType.ACCOMMODATION),
    ];

    // Insert all location data into Supabase
    const { data, error } = await supabase
      .from("location_data")
      .insert(
        locationData.map((item) => ({
          ...item,
          session_id: sessionId,
        }))
      )
      .select();

    if (error) {
      console.error("Error inserting location data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error processing location data:", error);
    return NextResponse.json(
      { error: "Failed to process location data" },
      { status: 500 }
    );
  }
}
