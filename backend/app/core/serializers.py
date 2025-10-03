from rest_framework import serializers

class AskRequest(serializers.Serializer):
    message = serializers.CharField(max_length=500)

class UpsertFaq(serializers.Serializer):
    question = serializers.CharField(max_length=500)
    answer = serializers.CharField()
    tags = serializers.CharField(required=False, allow_blank=True)
