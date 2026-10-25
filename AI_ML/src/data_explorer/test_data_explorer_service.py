from pprint import pprint

from src.data_explorer.data_explorer_service import (
    DataExplorerService,
)


def main():
    service = DataExplorerService()

    print("\n" + "=" * 70)
    print("DATA EXPLORER FILTER OPTIONS")
    print("=" * 70)
    pprint(service.get_filters())

    print("\n" + "=" * 70)
    print("OVERVIEW: ALL DATA")
    print("=" * 70)
    pprint(service.get_overview())

    print("\n" + "=" * 70)
    print("TOP CROPS")
    print("=" * 70)
    pprint(service.get_crop_statistics(limit=10))

    print("\n" + "=" * 70)
    print("DISTRICT COMPARISON")
    print("=" * 70)
    pprint(
        service.get_district_comparison(
            crop="Maize",
            season="Season A",
            limit=10,
        )
    )

    print("\n" + "=" * 70)
    print("SEASON COMPARISON")
    print("=" * 70)
    pprint(
        service.get_season_comparison(
            crop="Bush bean",
        )
    )

    print("\n" + "=" * 70)
    print("DATA TABLE")
    print("=" * 70)
    pprint(
        service.get_data_table(
            district="Huye",
            crop="Maize",
            season="Season A",
            page=1,
            page_size=5,
        )
    )


if __name__ == "__main__":
    main()