package utils

// JoinStrings joins a slice of strings with a separator
func JoinStrings(slice []string, separator string) string {
	result := ""
	for i, s := range slice {
		if i > 0 {
			result += separator
		}
		result += s
	}
	return result
}
