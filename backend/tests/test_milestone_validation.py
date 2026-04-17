from app.crud import calculate_le


def test_le_calculation_accuracy():
    assert calculate_le(120, 100) == 120.0
    assert calculate_le(80, 100) == 80.0
    assert calculate_le(123.456, 100) == 123.46
